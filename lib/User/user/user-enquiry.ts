"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { triggerCRMWebhooks } from "@/lib/crm/webhooks";
import { sendEmail } from "@/lib/notifications/email";
import { notifyAdminsPush, sendExpoPushNotification } from "@/lib/pushNotifications";
// import { sendWhatsAppTemplateMessage } from "@/lib/notifications/whatsapp";

export async function submitStudentEnquiry(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;
    const instituteId = formData.get("instituteId") as string;
    const email = formData.get("email") as string | null;

    const enquiry = await prisma.instituteEnquiry.create({
      data: {
        name,
        phone,
        message,
        instituteId,
        email: email || null,
        status: "NEW",
      },
    });

    const institute = await prisma.institute.findUnique({
      where: { id: instituteId },
      select: { name: true, phone: true, email: true, slug: true },
    });

    await prisma.adminNotification.create({
      data: {
        type: "NEW_INSTITUTE_ENQUIRY",
        title: "New Institute Enquiry",
        message: `${name} (${phone}) sent an enquiry for institute ID: ${instituteId}. and name ${institute?.name}`,
      },
    });

    notifyAdminsPush({
      title: "📞 New Website Enquiry!",
      body: `${name} (${phone}) requested callback for ${institute?.name || 'Academy'}`,
      data: { screen: '(admin)/callbacks' }
    });

    // Fire CRM Webhooks
    triggerCRMWebhooks(instituteId, "ENQUIRY", {
      enquiryId: enquiry.id,
      name,
      phone,
      email,
      message,
      source: "AcademyFind Website",
    });

    const instituteName = institute?.name || "the institute";
    const instituteSlug = institute?.slug || "";
    const institutePageLink = `https://academyfind.com/institute/${instituteId}-${instituteSlug}`;

    // Async Notifications (don't await to avoid blocking user response)
    (async () => {
      try {
        // --- 1. Notify the User ---
        if (email) {
          await sendEmail(
            email,
            `Your Enquiry for ${instituteName} - AcademyFind`,
            `<p>Hi ${name} 👋</p>
            <p>Thank you for choosing AcademyFind! 🎓</p>
            <p>Your enquiry for <strong>${instituteName}</strong> has been shared with the institute. They've been requested to contact you shortly.</p>
            <p><em>Haven’t heard back?</em> Reply <strong>HELP</strong> and the AcademyFind team will assist you.</p>
            <p>With AcademyFind, you can discover, compare and connect with coaching institutes, tutors and learning centres across India — and make more informed decisions before joining.</p>
            <p>Wishing you the best in your learning journey! 🌟</p>
            <p>Team AcademyFind<br/>🌐 www.academyfind.com<br/>📞 9045699938</p>`
          );
        }
        // if (phone) {
        //   await sendWhatsAppTemplateMessage(phone, "student_enquiry_confirmation", [
        //     { type: "text", text: name },
        //     { type: "text", text: instituteName }
        //   ]);
        // }

        // --- 2. Notify the Institute ---
        const instEmail = institute?.email;
        const instPhone = institute?.phone;

        if (instEmail) {
          await sendEmail(
            instEmail,
            `New Student Enquiry from ${name} - AcademyFind`,
            `<p>Hello <strong>${instituteName}</strong> 👋</p>
            <p>We received a student enquiry for your classes on AcademyFind from <strong>${name}</strong>. 🎓</p>
            <p>Student would like to know: <br/><em>${message || "No message provided"}</em></p>
            <p>If ${name} hasn't contacted you directly, reply to this message and we'll help facilitate the connection.</p>
            <br/>
            <p>🚀 Want more enquiries like this?</p>
            <p>Claim your AcademyFind profile to receive student leads directly and build your institute's presence on India's education discovery platform.</p>
            <p>🔗 <a href="${institutePageLink}">${institutePageLink}</a></p>
            <p>Your AcademyFind profile can also serve as your online institute page.</p>
            <p>Discover. Compare. Connect. Decide better.</p>
            <br/>
            <p>Team AcademyFind<br/>🌐 www.academyfind.com | 📞 9045699938</p>`
          );
        }
        // if (instPhone) {
        //   await sendWhatsAppTemplateMessage(instPhone, "institute_new_lead", [
        //     { type: "text", text: instituteName },
        //     { type: "text", text: name },
        //     { type: "text", text: message || "No message provided" },
        //     { type: "text", text: institutePageLink }
        //   ]);
        // }
        
        // --- 3. Notify Institute Managers (Push Notification) ---
        const managers = await prisma.instituteManager.findMany({
          where: { instituteId },
          include: { user: { select: { pushToken: true } } }
        });
        
        managers.forEach(manager => {
          if (manager.user?.pushToken) {
            sendExpoPushNotification({
              pushToken: manager.user.pushToken,
              title: `📞 New Lead: ${name}`,
              body: `${name} (${phone}) sent a new enquiry for ${instituteName}.`,
              data: { screen: '(manager)', instituteId }
            }).catch(err => console.error("Manager push error:", err));
          }
        });
        
      } catch (notifErr) {
        console.error("Failed to send async notifications:", notifErr);
      }
    })();

    return { success: true };
  } catch (error) {
    console.error("Enquiry Error:", error);
    return { success: false, error: "Something went wrong" };
  }
}