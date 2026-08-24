import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const data = await resend.emails.send({
      from: 'AcademyFind <hello@academyfind.com>', // Assuming hello@academyfind.com is verified
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}:`, data);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}
