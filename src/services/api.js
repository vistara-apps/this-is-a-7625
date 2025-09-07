import axios from 'axios';

// API Configuration
const API_CONFIG = {
  BITQUERY_API_KEY: process.env.VITE_BITQUERY_API_KEY || 'demo-key',
  ALCHEMY_API_KEY: process.env.VITE_ALCHEMY_API_KEY || 'demo-key',
  OPENAI_API_KEY: process.env.VITE_OPENAI_API_KEY || 'demo-key',
  SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'demo-key',
};

// Bitquery API Client
export const bitqueryClient = axios.create({
  baseURL: 'https://graphql.bitquery.io',
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': API_CONFIG.BITQUERY_API_KEY,
  },
});

// Alchemy API Client
export const alchemyClient = axios.create({
  baseURL: `https://eth-mainnet.g.alchemy.com/v2/${API_CONFIG.ALCHEMY_API_KEY}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// OpenAI API Client
export const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_CONFIG.OPENAI_API_KEY}`,
  },
});

// Supabase Client Configuration
export const supabaseConfig = {
  url: API_CONFIG.SUPABASE_URL,
  key: API_CONFIG.SUPABASE_ANON_KEY,
};

// Generic API Error Handler
export const handleApiError = (error, context = 'API') => {
  console.error(`${context} Error:`, error);
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    throw new Error(`${context} Error ${status}: ${data.message || 'Unknown error'}`);
  } else if (error.request) {
    // Request was made but no response received
    throw new Error(`${context} Error: No response received`);
  } else {
    // Something else happened
    throw new Error(`${context} Error: ${error.message}`);
  }
};

// Rate limiting helper
export const rateLimitedRequest = async (requestFn, delay = 1000) => {
  try {
    const result = await requestFn();
    return result;
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limited, wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      return await requestFn();
    }
    throw error;
  }
};
