const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    const embedding = result.embedding?.values;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    return embedding;
  } catch (error) {
    console.error('Gemini generateEmbedding error:', error.message);
    throw error;
  }
}

async function summarizeText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Summarize the following conversation:\n${text}`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(
      'Gemini summarizeText error:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function answerQuestion(context, question) {
  const apiKey = process.env.GEMINI_API_KEY;
  const prompt = `Context: ${context}\nQuestion: ${question}`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error(
      'Gemini answerQuestion error:',
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = { generateEmbedding, summarizeText, answerQuestion };
