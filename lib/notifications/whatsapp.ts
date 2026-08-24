/* --- WHATSAPP MICROSERVICE CODE (COMMENTED OUT) ---
export async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const serviceUrl = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3001';

    const response = await fetch(`${serviceUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: to, message }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      console.error("WhatsApp Microservice Error:", data);
      return { success: false, error: data };
    }

    console.log(`WhatsApp message sent to ${to}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${to}:`, error);
    return { success: false, error };
  }
}

// Keeping the template function signature for backward compatibility,
// but converting it to send raw text via the microservice.
export async function sendWhatsAppTemplateMessage_Microservice(
  to: string,
  templateName: string,
  parameters: { type: "text"; text: string }[]
) {
  // Convert template parameters to a readable text message
  let rawMessage = `New Notification (Template: ${templateName})\n\n`;
  parameters.forEach((param, index) => {
    rawMessage += `- ${param.text}\n`;
  });
  
  // Custom logic for known templates can be added here
  if (templateName === 'new_enquiry' && parameters.length >= 3) {
    rawMessage = `🔔 *New Enquiry Received!*\n\n*Name:* ${parameters[0].text}\n*Contact:* ${parameters[1].text}\n*Institute:* ${parameters[2].text}`;
  }

  return sendWhatsAppMessage(to, rawMessage);
}
------------------------------------------------- */

// ORIGINAL META API CODE
export async function sendWhatsAppTemplateMessage(
  to: string,
  templateName: string,
  parameters: { type: "text"; text: string }[]
) {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
      console.warn("WhatsApp API credentials are not set.");
      return { success: false, error: "Missing WhatsApp credentials" };
    }

    // Ensure 'to' has country code without '+' or '00', assuming Indian (+91) if 10 digits
    let formattedTo = to.replace(/\D/g, "");
    if (formattedTo.length === 10) {
      formattedTo = "91" + formattedTo;
    }

    const payload = {
      messaging_product: "whatsapp",
      to: formattedTo,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en",
        },
        components: [
          {
            type: "body",
            parameters: parameters,
          },
        ],
      },
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API Error:", data);
      return { success: false, error: data };
    }

    console.log(`WhatsApp Template '${templateName}' sent to ${formattedTo}`);
    return { success: true, data };
  } catch (error) {
    console.error(`Failed to send WhatsApp Template message to ${to}:`, error);
    return { success: false, error };
  }
}
