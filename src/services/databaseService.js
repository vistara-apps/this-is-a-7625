import { supabaseConfig, handleApiError } from './api.js';

/**
 * Database Service - Handles data persistence using Supabase
 */

// Mock Supabase client for demo purposes
// In production, you would use: import { createClient } from '@supabase/supabase-js'
class MockSupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.mockData = {
      users: [],
      portfolios: [],
      swap_transactions: [],
      meme_coin_trends: [],
    };
  }

  from(table) {
    return {
      select: (columns = '*') => ({
        eq: (column, value) => ({
          data: this.mockData[table].filter(item => item[column] === value),
          error: null,
        }),
        order: (column, options = {}) => ({
          data: this.mockData[table].sort((a, b) => {
            if (options.ascending === false) {
              return b[column] > a[column] ? 1 : -1;
            }
            return a[column] > b[column] ? 1 : -1;
          }),
          error: null,
        }),
        limit: (count) => ({
          data: this.mockData[table].slice(0, count),
          error: null,
        }),
        data: this.mockData[table],
        error: null,
      }),
      insert: (data) => {
        const newItem = { 
          id: Date.now().toString(), 
          created_at: new Date().toISOString(),
          ...data 
        };
        this.mockData[table].push(newItem);
        return { data: [newItem], error: null };
      },
      update: (data) => ({
        eq: (column, value) => {
          const index = this.mockData[table].findIndex(item => item[column] === value);
          if (index !== -1) {
            this.mockData[table][index] = { ...this.mockData[table][index], ...data };
            return { data: [this.mockData[table][index]], error: null };
          }
          return { data: [], error: 'Record not found' };
        },
      }),
      delete: () => ({
        eq: (column, value) => {
          const index = this.mockData[table].findIndex(item => item[column] === value);
          if (index !== -1) {
            const deleted = this.mockData[table].splice(index, 1);
            return { data: deleted, error: null };
          }
          return { data: [], error: 'Record not found' };
        },
      }),
    };
  }
}

// Initialize Supabase client
const supabase = new MockSupabaseClient(supabaseConfig.url, supabaseConfig.key);

/**
 * User Management
 */

// Create or update user profile
export const upsertUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        user_id: userData.userId,
        eth_address: userData.ethAddress,
        connected_wallets: userData.connectedWallets || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return data[0];
  } catch (error) {
    handleApiError(error, 'Database Service - Upsert User');
    return null;
  }
};

// Get user by wallet address
export const getUserByAddress = async (ethAddress) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('eth_address', ethAddress);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    handleApiError(error, 'Database Service - Get User');
    return null;
  }
};

/**
 * Portfolio Management
 */

// Save portfolio snapshot
export const savePortfolioSnapshot = async (portfolioData) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .insert({
        user_id: portfolioData.userId,
        token_address: portfolioData.tokenAddress,
        chain: portfolioData.chain,
        quantity: portfolioData.quantity,
        purchase_price: portfolioData.purchasePrice,
        current_price: portfolioData.currentPrice,
        last_updated: new Date().toISOString(),
      });

    if (error) throw error;
    return data[0];
  } catch (error) {
    handleApiError(error, 'Database Service - Save Portfolio');
    return null;
  }
};

// Get user portfolio
export const getUserPortfolio = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleApiError(error, 'Database Service - Get Portfolio');
    return [];
  }
};

// Update portfolio item
export const updatePortfolioItem = async (portfolioId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .update({
        ...updateData,
        last_updated: new Date().toISOString(),
      })
      .eq('id', portfolioId);

    if (error) throw error;
    return data[0];
  } catch (error) {
    handleApiError(error, 'Database Service - Update Portfolio');
    return null;
  }
};

/**
 * Swap Transaction Management
 */

// Save swap transaction
export const saveSwapTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('swap_transactions')
      .insert({
        swap_id: transactionData.swapId,
        user_id: transactionData.userId,
        from_token: transactionData.fromToken,
        from_chain: transactionData.fromChain,
        to_token: transactionData.toToken,
        to_chain: transactionData.toChain,
        amount: transactionData.amount,
        fee: transactionData.fee,
        transaction_hash: transactionData.transactionHash,
        status: transactionData.status,
        timestamp: new Date().toISOString(),
      });

    if (error) throw error;
    return data[0];
  } catch (error) {
    handleApiError(error, 'Database Service - Save Swap Transaction');
    return null;
  }
};

// Get user swap history
export const getUserSwapHistory = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleApiError(error, 'Database Service - Get Swap History');
    return [];
  }
};

// Update swap transaction status
export const updateSwapStatus = async (swapId, status, transactionHash = null) => {
  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    const { data, error } = await supabase
      .from('swap_transactions')
      .update(updateData)
      .eq('swap_id', swapId);

    if (error) throw error;
    return data[0];
  } catch (error) {
    handleApiError(error, 'Database Service - Update Swap Status');
    return null;
  }
};

/**
 * Meme Coin Trends Management
 */

// Save trend data
export const saveTrendData = async (trendData) => {
  try {
    const { data, error } = await supabase
      .from('meme_coin_trends')
      .insert({
        trend_id: trendData.trendId,
        token_address: trendData.tokenAddress,
        chain: trendData.chain,
        sentiment_score: trendData.sentimentScore,
        volume: trendData.volume,
        price_change_24h: trendData.priceChange24h,
        market_cap: trendData.marketCap,
        last_updated: new Date().toISOString(),
      });

    if (error) throw error;
    return data[0];
  } catch (error) {
    handleApiError(error, 'Database Service - Save Trend Data');
    return null;
  }
};

// Get trending coins
export const getTrendingCoins = async (chain = null, limit = 20) => {
  try {
    let query = supabase
      .from('meme_coin_trends')
      .select('*')
      .order('sentiment_score', { ascending: false })
      .limit(limit);

    if (chain) {
      query = query.eq('chain', chain);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleApiError(error, 'Database Service - Get Trending Coins');
    return [];
  }
};

// Clean old trend data (keep only last 7 days)
export const cleanOldTrendData = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('meme_coin_trends')
      .delete()
      .lt('last_updated', sevenDaysAgo.toISOString());

    if (error) throw error;
    return data;
  } catch (error) {
    handleApiError(error, 'Database Service - Clean Old Trend Data');
    return null;
  }
};

/**
 * Analytics and Statistics
 */

// Get user statistics
export const getUserStatistics = async (userId) => {
  try {
    // Get portfolio count
    const portfolioQuery = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    // Get swap count
    const swapQuery = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId);

    const portfolio = portfolioQuery.data || [];
    const swaps = swapQuery.data || [];

    // Calculate statistics
    const totalValue = portfolio.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.current_price));
    }, 0);

    const totalSwaps = swaps.length;
    const successfulSwaps = swaps.filter(swap => swap.status === 'completed').length;
    const totalFees = swaps.reduce((sum, swap) => sum + parseFloat(swap.fee || 0), 0);

    const uniqueChains = [...new Set(portfolio.map(item => item.chain))];
    const uniqueTokens = [...new Set(portfolio.map(item => item.token_address))];

    return {
      totalPortfolioValue: totalValue,
      totalTokens: uniqueTokens.length,
      totalChains: uniqueChains.length,
      totalSwaps,
      successfulSwaps,
      swapSuccessRate: totalSwaps > 0 ? (successfulSwaps / totalSwaps) * 100 : 0,
      totalFeesSpent: totalFees,
      lastActivity: swaps[0]?.timestamp || portfolio[0]?.last_updated,
    };
  } catch (error) {
    handleApiError(error, 'Database Service - Get User Statistics');
    return {
      totalPortfolioValue: 0,
      totalTokens: 0,
      totalChains: 0,
      totalSwaps: 0,
      successfulSwaps: 0,
      swapSuccessRate: 0,
      totalFeesSpent: 0,
      lastActivity: null,
    };
  }
};

// Get platform statistics
export const getPlatformStatistics = async () => {
  try {
    const usersQuery = await supabase.from('users').select('*');
    const portfoliosQuery = await supabase.from('portfolios').select('*');
    const swapsQuery = await supabase.from('swap_transactions').select('*');
    const trendsQuery = await supabase.from('meme_coin_trends').select('*');

    const users = usersQuery.data || [];
    const portfolios = portfoliosQuery.data || [];
    const swaps = swapsQuery.data || [];
    const trends = trendsQuery.data || [];

    const totalVolume = swaps.reduce((sum, swap) => {
      return sum + parseFloat(swap.amount || 0);
    }, 0);

    const totalFees = swaps.reduce((sum, swap) => {
      return sum + parseFloat(swap.fee || 0);
    }, 0);

    return {
      totalUsers: users.length,
      totalPortfolios: portfolios.length,
      totalSwaps: swaps.length,
      totalVolume,
      totalFeesCollected: totalFees,
      activeTrends: trends.length,
      avgPortfolioSize: users.length > 0 ? portfolios.length / users.length : 0,
    };
  } catch (error) {
    handleApiError(error, 'Database Service - Get Platform Statistics');
    return {
      totalUsers: 0,
      totalPortfolios: 0,
      totalSwaps: 0,
      totalVolume: 0,
      totalFeesCollected: 0,
      activeTrends: 0,
      avgPortfolioSize: 0,
    };
  }
};

/**
 * Database Schema Creation (for reference)
 */
export const createTables = async () => {
  // This would be used to create the initial database schema
  // In Supabase, you would run these SQL commands in the SQL editor
  
  const schemas = {
    users: `
      CREATE TABLE users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id VARCHAR UNIQUE NOT NULL,
        eth_address VARCHAR UNIQUE NOT NULL,
        connected_wallets JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    portfolios: `
      CREATE TABLE portfolios (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id VARCHAR REFERENCES users(user_id),
        token_address VARCHAR NOT NULL,
        chain VARCHAR NOT NULL,
        quantity DECIMAL NOT NULL,
        purchase_price DECIMAL,
        current_price DECIMAL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    swap_transactions: `
      CREATE TABLE swap_transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        swap_id VARCHAR UNIQUE NOT NULL,
        user_id VARCHAR REFERENCES users(user_id),
        from_token VARCHAR NOT NULL,
        from_chain VARCHAR NOT NULL,
        to_token VARCHAR NOT NULL,
        to_chain VARCHAR NOT NULL,
        amount DECIMAL NOT NULL,
        fee DECIMAL,
        transaction_hash VARCHAR,
        status VARCHAR DEFAULT 'pending',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
    meme_coin_trends: `
      CREATE TABLE meme_coin_trends (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        trend_id VARCHAR UNIQUE NOT NULL,
        token_address VARCHAR NOT NULL,
        chain VARCHAR NOT NULL,
        sentiment_score INTEGER,
        volume DECIMAL,
        price_change_24h DECIMAL,
        market_cap DECIMAL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `,
  };

  return schemas;
};
