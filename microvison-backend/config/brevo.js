const axios = require('axios');
require('dotenv').config();

const BREVO_KEY = process.env.BREVO_API_KEY;
const BASE_URL = 'https://api.brevo.com/v3/smtp/email';

const sendEmail = async (to, subject, html) => {
  try {
    const response = await axios.post(
      BASE_URL,
      {
        sender: { name: 'Microvison', email: process.env.BREVO_FROM_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          'api-key': BREVO_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Brevo Email Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { BREVO_KEY, BASE_URL, sendEmail };
