require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sendWhatsApp = require('./sendWhatsApp');

const recipient = process.argv[2];
if (!recipient) {
    console.error("Usage: node utils/testTemplate.js <phone_number_with_country_code>");
    process.exit(1);
}

const templateName = 'sc_new_assignment';
const params = [
    "John Doe",           // {{1}} Customer Name
    "9876543210",         // {{2}} Customer Phone
    "123 Main St, Delhi", // {{3}} Customer Address
    "LED TV",             // {{4}} Product
    "MV-LED-43",          // {{5}} Model
    "SN123456789",        // {{6}} Serial No
    "Screen flickering",  // {{7}} Issue
    "MV-C-12345",         // {{8}} Request ID
    "https://www.microvisonservice.co.in/" // {{9}} Portal Link
];

console.log(`Sending test template '${templateName}' to ${recipient}...`);

sendWhatsApp(recipient, templateName, params)
    .then(response => {
        console.log("Response:", JSON.stringify(response, null, 2));
    })
    .catch(err => {
        console.error("Failed to send template:", err);
    });