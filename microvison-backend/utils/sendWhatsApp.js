const axios = require('axios');

/**
 * Sends a WhatsApp message using Meta's Cloud API.
 * Cleans phone numbers, formats template parameters, and handles errors gracefully.
 *
 * @param {string} phone - Recipient phone number (e.g. 10-digit Indian number or E.164 without plus)
 * @param {string} templateName - Approved template name on Meta Business Manager (e.g., 'hello_world')
 * @param {Array<string|number>} parameters - Sequential parameters for the template body
 * @returns {Promise<object|null>} - Response data from Meta or null if skipped/failed
 */
const sendWhatsApp = async (phone, templateName, parameters = []) => {
  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!phone) {
      console.warn('[WhatsApp] Skipped sending: No phone number provided.');
      return null;
    }

    // Clean phone number: keep only digits
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10) {
      cleanedPhone = `91${cleanedPhone}`;
    }

    console.log(`[WhatsApp] Preparing to send template "${templateName}" to ${cleanedPhone} with params:`, parameters);

    if (!token || !phoneId || token === 'EAAG_SANDBOX_TOKEN_PLACEHOLDER' || token.startsWith('EAAG...')) {
      console.info(`[WhatsApp] [SANDBOX MODE] Simulated message delivery to ${cleanedPhone} using template "${templateName}".`);
      return { simulated: true, phone: cleanedPhone, templateName, parameters };
    }

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: cleanedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_US" }
      }
    };

    // If template is 'hello_world', do not pass any parameters/components (as it doesn't support them)
    if (templateName !== 'hello_world' && parameters && parameters.length > 0) {
      payload.template.components = [
        {
          type: "body",
          parameters: parameters.map(param => ({
            type: "text",
            text: param !== undefined && param !== null ? String(param) : ""
          }))
        }
      ];
    }

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[WhatsApp] Message sent successfully. Message ID:`, response.data?.messages?.[0]?.id || 'N/A');
    return response.data;
  } catch (error) {
    // Graceful error handling: log detailed warning, but do NOT throw/reject
    console.error('[WhatsApp] Error sending WhatsApp message:', error.response?.data || error.message);
    return null;
  }
};

module.exports = sendWhatsApp;
