require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sendWhatsApp = require('./sendWhatsApp');

const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: node utils/testAllTemplates.js <phone_number_with_country_code>");
  process.exit(1);
}

const templates = [
  {
    name: 'customer_sc_assigned2',
    params: [
      "MV-C-12345",                               // {{1}} Complaint ID
      "LED TV",                                   // {{2}} Product
      "installation",                             // {{3}} Request Type
      "FixIt Fast",                               // {{4}} SC Name
      "9876543210",                               // {{5}} SC Phone
      "1800-123-4567"                             // {{6}} Support Number
    ]
  },
  {
    name: 'sc_new_assignment',
    params: [
      "John Doe",                                 // {{1}} Customer Name
      "9876543210",                               // {{2}} Customer Phone
      "123 Main Street, Delhi",                   // {{3}} Customer Address
      "LED TV",                                   // {{4}} Product
      "Installation",                             // {{5}} Request Type
      "Under Warranty",                           // {{6}} Warranty status
      "SN-987654321",                             // {{7}} Serial No
      "MV-C-12345",                               // {{8}} Complaint ID
      "https://microvisonservice.co.in/sc-portal" // {{9}} Portal Link
    ]
  },
  {
    name: 'sc_assignment_reminder',
    params: [
      "Installation",                             // {{1}} Request Type
      "MV-C-12345",                               // {{2}} Complaint ID
      "LED TV",                                   // {{3}} Product
      "John Doe",                                 // {{4}} Customer Name
      "123 Main Street, Delhi",                   // {{5}} Customer Address
      "https://microvisonservice.co.in/sc-portal" // {{6}} Portal Link
    ]
  },
  {
    name: 'sc_post_accept_reminder',
    params: [
      "Installation",                             // {{1}} Request Type
      "MV-C-12345",                               // {{2}} Complaint ID
      "LED TV",                                   // {{3}} Product
      "John Doe",                                 // {{4}} Customer Name
      "123 Main Street, Delhi",                   // {{5}} Customer Address
      "https://microvisonservice.co.in/sc-portal" // {{6}} Portal Link
    ]
  },
  {
    name: 'sc_not_done_reminder',
    params: [
      "MV-C-12345",                               // {{1}} Complaint ID
      "LED TV",                                   // {{2}} Product
      "John Doe",                                 // {{3}} Customer Name
      "123 Main Street, Delhi",                   // {{4}} Customer Address
      "https://microvisonservice.co.in/sc-portal" // {{5}} Portal Link
    ]
  },
  {
    name: 'sc_part_dispatched',
    params: [
      "MV-C-12345",                               // {{1}} Complaint ID
      "John Doe",                                 // {{2}} Customer Name
      "123 Main Street, Delhi",                   // {{3}} Customer Address
      "Dispatched via DTDC tracking #123456",     // {{4}} Admin Note
      "https://microvisonservice.co.in/sc-portal" // {{5}} Portal Link
    ]
  },
  {
    name: 'sc_part_received_reminder',
    params: [
      "MV-C-12345",                               // {{1}} Complaint ID
      "LED TV",                                   // {{2}} Product
      "John Doe",                                 // {{3}} Customer Name
      "123 Main Street, Delhi",                   // {{4}} Customer Address
      "https://microvisonservice.co.in/sc-portal" // {{5}} Portal Link
    ]
  }
];

async function sendAll() {
  for (const template of templates) {
    console.log(`\n======================================`);
    console.log(`Sending '${template.name}' to ${recipient}...`);
    try {
      const response = await sendWhatsApp(recipient, template.name, template.params);
      console.log(`Success:`, JSON.stringify(response, null, 2));
    } catch (err) {
      console.error(`Failed to send ${template.name}:`, err.message || err);
    }
    // Wait 2.5 seconds between requests to avoid rate limiting or ordering issues
    await new Promise(resolve => setTimeout(resolve, 2500));
  }
}

sendAll();
