import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerCRMWebhooks } from '@/lib/crm/webhooks';
import { sendEmail } from '@/lib/notifications/email';
import { notifyAdminsPush } from '@/lib/pushNotifications';
// import { sendWhatsAppTemplateMessage } from '@/lib/notifications/whatsapp';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, message, email } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and phone are required' }, { status: 400 });
    }

    const enquiry = await prisma.instituteEnquiry.create({
      data: {
        name,
        phone,
        message: message || '',
        instituteId: id,
        email: email || null,
        status: "NEW",
      },
    });

    const institute = await prisma.institute.findUnique({
      where: { id },
      select: { name: true, phone: true, email: true, slug: true },
    });

    await prisma.adminNotification.create({
      data: {
        type: "NEW_INSTITUTE_ENQUIRY",
        title: "New Mobile App Enquiry",
        message: `${name} (${phone}) sent an enquiry via Mobile App for institute ID: ${id} and name ${institute?.name}`,
      },
    });

    // Notify Admin's Phone via Mobile Push Notification
    notifyAdminsPush({
      title: "📞 New Student Enquiry!",
      body: `${name} (${phone}) requested callback for ${institute?.name || 'Academy'}`,
      data: { screen: '(admin)/callbacks' }
    });

    // Fire CRM Webhooks
    triggerCRMWebhooks(id, "ENQUIRY", {
      enquiryId: enquiry.id,
      name,
      phone,
      email,
      message,
      source: "AcademyFind App",
    });

    const instituteName = institute?.name || "the institute";
    const instituteSlug = institute?.slug || "";
    const institutePageLink = `https://academyfind.com/institute/${id}-${instituteSlug}`;

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
            <p>If ${name} hasn't contacted you directly, <strong>reply to this email and we'll help facilitate the connection</strong>.</p>
            <p>🚀 <strong>Want more enquiries like this?</strong><br/>
            Claim your AcademyFind profile to receive student leads directly and build your institute's presence on India's education discovery platform.</p>
            <p>🔗 <a href="${institutePageLink}">${institutePageLink}</a></p>
            <p>Your AcademyFind profile can also serve as your online institute page.</p>
            <p>Discover. Compare. Connect. Decide better.</p>
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
      } catch (notifErr) {
        console.error("Failed to send async notifications:", notifErr);
      }
    })();

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error: any) {
    console.error("Mobile Enquiry Error:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
