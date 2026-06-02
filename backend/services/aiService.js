const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

async function summarizeText(text) {
  try {
    const prompt =
      `Summarize the following chat conversation in a few clear bullet points:\n\n${text}`;

    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }
    );

    const candidates = response.data?.candidates;
    const summary = candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error('Empty or unexpected response from Gemini');
    }

    return summary;
  } catch (error) {
    console.error(
      'Summarize error:',
      error.response?.data || error.message || error
    );
    throw error;
  }
}

module.exports = { summarizeText };
