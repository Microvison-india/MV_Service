require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sendWhatsApp = require('./sendWhatsApp');

const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: node utils/testTemplate.js <phone_number_with_country_code>");
  process.exit(1);
}

const templateName = 'customer_sc_assigned';
const params = [
  "MV-C-12345",         // {{1}} Complaint ID
  "LED TV",             // {{2}} Product
  "installation",       // {{3}} Request Type
  "FixIt Fast",         // {{4}} SC Name
  "9876543210",         // {{5}} SC Phone
  "1800-123-4567"       // {{6}} Support Number
];

console.log(`Sending test template '${templateName}' to ${recipient}...`);

sendWhatsApp(recipient, templateName, params)
  .then(response => {
    console.log("Response:", JSON.stringify(response, null, 2));
  })
  .catch(err => {
    console.error("Failed to send template:", err);
  });
