const axios = require('axios');

const sendEmail = async ({ to, subject, htmlContent }) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Microvison Support', email: process.env.BREVO_SENDER_EMAIL || 'support@microvison.com' },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Brevo Email Error:', error.response?.data || error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
