/**
 * utils/testWhatsApp.js
 * Run: node utils/testWhatsApp.js <phone_number>
 * Example: node utils/testWhatsApp.js 917976046473
 * 
 * Verifies the production WhatsApp Cloud API settings in your .env
 * by sending Meta's default integration test template.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');

const token = process.env.WHATSAPP_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Get recipient phone number from CLI arguments
const recipient = process.argv[2];

if (!recipient) {
  console.error("❌ Error: Please provide a recipient phone number.");
  console.log("Usage: node utils/testWhatsApp.js <phone_number_with_country_code>");
  console.log("Example: node utils/testWhatsApp.js 917976046473");
  process.exit(1);
}

if (!token || !phoneId || token === 'EAAG_SANDBOX_TOKEN_PLACEHOLDER' || token.startsWith('EAAG...')) {
  console.error("❌ Error: A valid production WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be configured in your .env file.");
  process.exit(1);
}

const url = `https://graph.facebook.com/v25.0/${phoneId}/messages`;

const payload = JSON.stringify({
  messaging_product: "whatsapp",
  to: recipient,
  type: "template",
  template: {
    name: "3p_direct_integration_test_template",
    language: { code: "en_US" }
  }
});

const options = {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

console.log(`[WhatsApp Test] Sending test template message to ${recipient} using Phone ID ${phoneId}...`);

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`[WhatsApp Test] Status Code: ${res.statusCode}`);
    console.log(`[WhatsApp Test] Response: ${data}`);
    if (res.statusCode === 200) {
      console.log("✅ [WhatsApp Test] Message sent successfully!");
    } else {
      console.error("❌ [WhatsApp Test] Message sending failed. Check the error response above.");
    }
  });
});

req.on('error', (error) => {
  console.error(`❌ [WhatsApp Test] Network Error: ${error.message}`);
});

req.write(payload);
req.end();
