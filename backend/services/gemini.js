const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini API key is not configured');
    error.statusCode = 503;
    throw error;
  }
  return apiKey;
};

const extractText = (response) => {
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const error = new Error('Empty or unexpected response from Gemini');
    error.statusCode = 502;
    throw error;
  }
  return text;
};

const normalizeGeminiError = (error, fallbackMessage) => {
  const status = error.response?.status || error.statusCode || 500;
  const providerMessage = error.response?.data?.error?.message;

  if (status === 429) {
    const quotaError = new Error('Gemini API quota exceeded. Please wait and try again.');
    quotaError.statusCode = 429;
    return quotaError;
  }

  const normalized = new Error(providerMessage || error.message || fallbackMessage);
  normalized.statusCode = status;
  return normalized;
};

async function generateEmbedding(text) {
  const apiKey = getApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    const embedding = result.embedding?.values;
    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }
    return embedding;
  } catch (error) {
    console.error('Gemini generateEmbedding error:', error.message);
    throw normalizeGeminiError(error, 'Failed to generate embedding');
  }
}

async function summarizeText(text) {
  const apiKey = getApiKey();
  if (!text?.trim()) {
    return 'No messages are available to summarize yet.';
  }

  const prompt = `Summarize the following conversation:\n${text}`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 60000 }
    );
    return extractText(response);
  } catch (error) {
    console.error(
      'Gemini summarizeText error:',
      error.response?.data || error.message
    );
    throw normalizeGeminiError(error, 'Failed to summarize conversation');
  }
}

async function answerQuestion(context, question) {
  const apiKey = getApiKey();
  const prompt = `
  You are an assistant answering questions about a chat history.

  Use ONLY the information provided in the context below.

  If the answer exists in the context:
  - Give a direct answer.
  - Combine information from multiple messages.
  - Be concise and factual.

  If the answer cannot be found in the context:
  - Say "I could not find that information in the chat history."

  Context:
  ${context}

  Question:
  ${question}

  Answer:
  `;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { timeout: 60000 }
    );
    return extractText(response);
  } catch (error) {
    console.error(
      'Gemini answerQuestion error:',
      error.response?.data || error.message
    );
    throw normalizeGeminiError(error, 'Failed to answer question');
  }
}

module.exports = { generateEmbedding, summarizeText, answerQuestion };
