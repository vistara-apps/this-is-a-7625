import { bitqueryClient, openaiClient, handleApiError, rateLimitedRequest } from './api.js';

/**
 * Trend Service - Handles fetching and analyzing meme coin trends
 */

// Popular meme coin contract addresses for monitoring
const MEME_COIN_ADDRESSES = {
  ethereum: [
    '0x6982508145454ce325ddbe47a25d4ec3d2311933', // PEPE
    '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', // SHIB
    '0xa0b86a33e6441e8c8c5b8b8b8b8b8b8b8b8b8b8b', // FLOKI
    '0x4d224452801aced8b2f0aebe155379bb5d594381', // APE
  ],
  bsc: [
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8', // ETH
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
    '0x55d398326f99059ff775485246999027b3197955', // USDT
  ],
  solana: [
    // Solana addresses would be different format
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  ],
};

/**
 * Fetch trending meme coins using Bitquery
 */
export const fetchTrendingMemeCoins = async (chain = 'ethereum', limit = 20) => {
  try {
    const query = `
      query GetTrendingMemeCoins($network: EthereumNetwork!, $limit: Int!) {
        ethereum(network: $network) {
          dexTrades(
            options: {limit: $limit, desc: "count"}
            date: {since: "2024-01-01"}
            baseCurrency: {in: ${JSON.stringify(MEME_COIN_ADDRESSES[chain] || MEME_COIN_ADDRESSES.ethereum)}}
          ) {
            baseCurrency {
              address
              symbol
              name
            }
            count
            volume: tradeAmount(in: USD)
            maximum_price: quotePrice(calculate: maximum)
            minimum_price: quotePrice(calculate: minimum)
            average_price: quotePrice(calculate: average)
            trades: count
            buyers: count(uniq: buyers)
            sellers: count(uniq: sellers)
            block {
              timestamp {
                time(format: "%Y-%m-%d")
              }
            }
          }
        }
      }
    `;

    const response = await rateLimitedRequest(async () => {
      return await bitqueryClient.post('', {
        query,
        variables: {
          network: chain,
          limit,
        },
      });
    });

    const trades = response.data.data?.ethereum?.dexTrades || [];
    
    return trades.map(trade => ({
      contractAddress: trade.baseCurrency.address,
      symbol: trade.baseCurrency.symbol,
      name: trade.baseCurrency.name,
      chain: chain.charAt(0).toUpperCase() + chain.slice(1),
      price: `$${trade.average_price?.toFixed(6) || '0.000000'}`,
      volume24h: `$${(trade.volume / 1000000).toFixed(2)}M`,
      trades24h: trade.trades,
      buyers: trade.buyers,
      sellers: trade.sellers,
      priceChange: ((trade.maximum_price - trade.minimum_price) / trade.minimum_price * 100).toFixed(2),
      marketCap: `$${(trade.average_price * 1000000000).toFixed(0)}`, // Estimated
      lastUpdated: new Date().toISOString(),
    }));
  } catch (error) {
    console.warn('Bitquery trending data failed, using fallback:', error.message);
    return getFallbackTrendingData(chain);
  }
};

/**
 * Analyze sentiment using OpenAI
 */
export const analyzeSentiment = async (tokenSymbol, tokenName) => {
  try {
    const prompt = `
      Analyze the current market sentiment for the cryptocurrency ${tokenName} (${tokenSymbol}).
      Consider recent social media trends, trading volume, and market behavior.
      
      Provide a sentiment analysis with:
      1. Overall sentiment (Extremely Bullish, Very Bullish, Bullish, Neutral, Bearish, Very Bearish, Extremely Bearish)
      2. Sentiment score (0-100, where 100 is extremely bullish)
      3. Key factors influencing the sentiment
      4. Brief explanation (max 50 words)
      
      Format your response as JSON:
      {
        "sentiment": "sentiment_label",
        "score": sentiment_score,
        "factors": ["factor1", "factor2", "factor3"],
        "explanation": "brief explanation"
      }
    `;

    const response = await rateLimitedRequest(async () => {
      return await openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst specializing in meme coins and social sentiment analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
    });

    const content = response.data.choices[0].message.content;
    const sentimentData = JSON.parse(content);

    return {
      sentiment: sentimentData.sentiment,
      sentimentScore: sentimentData.score,
      factors: sentimentData.factors,
      explanation: sentimentData.explanation,
    };
  } catch (error) {
    console.warn('OpenAI sentiment analysis failed, using fallback:', error.message);
    // Return mock sentiment data
    const mockSentiments = ['Bullish', 'Very Bullish', 'Neutral', 'Bearish'];
    const randomSentiment = mockSentiments[Math.floor(Math.random() * mockSentiments.length)];
    
    return {
      sentiment: randomSentiment,
      sentimentScore: Math.floor(Math.random() * 100),
      factors: ['Social media buzz', 'Trading volume', 'Market trends'],
      explanation: `Mock sentiment analysis for ${tokenSymbol}`,
    };
  }
};

/**
 * Get comprehensive trend data with sentiment analysis
 */
export const getComprehensiveTrendData = async (chain = 'ethereum', limit = 10) => {
  try {
    // Fetch trending coins
    const trendingCoins = await fetchTrendingMemeCoins(chain, limit);
    
    // Analyze sentiment for each coin
    const sentimentPromises = trendingCoins.map(coin =>
      analyzeSentiment(coin.symbol, coin.name)
    );
    
    const sentimentResults = await Promise.allSettled(sentimentPromises);
    
    // Combine trending data with sentiment analysis
    const comprehensiveData = trendingCoins.map((coin, index) => {
      const sentimentResult = sentimentResults[index];
      const sentiment = sentimentResult.status === 'fulfilled' 
        ? sentimentResult.value 
        : {
            sentiment: 'Neutral',
            sentimentScore: 50,
            factors: ['Data unavailable'],
            explanation: 'Sentiment analysis unavailable',
          };

      return {
        id: `${coin.contractAddress}-${chain}`,
        ...coin,
        ...sentiment,
        trending: sentiment.sentimentScore > 70,
        change24h: parseFloat(coin.priceChange),
        logo: getTokenLogo(coin.symbol),
      };
    });

    // Sort by sentiment score and trading volume
    return comprehensiveData.sort((a, b) => {
      const scoreA = a.sentimentScore * 0.6 + a.trades24h * 0.4;
      const scoreB = b.sentimentScore * 0.6 + b.trades24h * 0.4;
      return scoreB - scoreA;
    });

  } catch (error) {
    handleApiError(error, 'Trend Service - Comprehensive Data');
    return getFallbackTrendingData(chain);
  }
};

/**
 * Get token logo emoji based on symbol
 */
const getTokenLogo = (symbol) => {
  const logoMap = {
    'PEPE': '🐸',
    'DOGE': '🐕',
    'SHIB': '🐕‍🦺',
    'BONK': '🦴',
    'WIF': '🐕',
    'FLOKI': '🐕',
    'APE': '🦍',
    'WOJAK': '😢',
    'CHAD': '💪',
    'MOON': '🌙',
    'ROCKET': '🚀',
    'DIAMOND': '💎',
  };
  
  return logoMap[symbol.toUpperCase()] || '🪙';
};

/**
 * Fallback trending data when APIs fail
 */
const getFallbackTrendingData = (chain) => {
  const mockData = [
    {
      id: '1',
      symbol: 'WOJAK',
      name: 'Wojak',
      chain: chain.charAt(0).toUpperCase() + chain.slice(1),
      price: '$0.000123',
      change24h: 234.5,
      volume24h: '$2.3M',
      sentiment: 'Extremely Bullish',
      sentimentScore: 95,
      marketCap: '$45M',
      logo: '😢',
      trending: true,
      trades24h: 1250,
      buyers: 890,
      sellers: 360,
      factors: ['Viral memes', 'High trading volume', 'Community growth'],
      explanation: 'Strong bullish sentiment driven by social media trends',
    },
    {
      id: '2',
      symbol: 'CHAD',
      name: 'Chad Token',
      chain: chain.charAt(0).toUpperCase() + chain.slice(1),
      price: '$0.00456',
      change24h: 156.7,
      volume24h: '$1.8M',
      sentiment: 'Very Bullish',
      sentimentScore: 87,
      marketCap: '$23M',
      logo: '💪',
      trending: true,
      trades24h: 980,
      buyers: 720,
      sellers: 260,
      factors: ['Strong community', 'Positive sentiment', 'Growing adoption'],
      explanation: 'Consistent bullish momentum with strong community support',
    },
    {
      id: '3',
      symbol: 'MOON',
      name: 'Moon Token',
      chain: chain.charAt(0).toUpperCase() + chain.slice(1),
      price: '$0.0789',
      change24h: 89.3,
      volume24h: '$967K',
      sentiment: 'Bullish',
      sentimentScore: 78,
      marketCap: '$12M',
      logo: '🌙',
      trending: false,
      trades24h: 650,
      buyers: 480,
      sellers: 170,
      factors: ['Technical breakout', 'Increased volume', 'Positive news'],
      explanation: 'Technical indicators showing bullish momentum',
    },
  ];

  return mockData;
};

/**
 * Filter and sort trend data
 */
export const filterTrendData = (trendData, filter = 'all', sortBy = 'volume') => {
  let filtered = [...trendData];

  // Apply filters
  switch (filter) {
    case 'trending':
      filtered = filtered.filter(token => token.trending);
      break;
    case 'bullish':
      filtered = filtered.filter(token => token.sentimentScore >= 80);
      break;
    case 'bearish':
      filtered = filtered.filter(token => token.sentimentScore <= 30);
      break;
    default:
      // 'all' - no filtering
      break;
  }

  // Apply sorting
  switch (sortBy) {
    case 'volume':
      filtered.sort((a, b) => {
        const volumeA = parseFloat(a.volume24h.replace(/[$M]/g, ''));
        const volumeB = parseFloat(b.volume24h.replace(/[$M]/g, ''));
        return volumeB - volumeA;
      });
      break;
    case 'price':
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.price.replace('$', ''));
        const priceB = parseFloat(b.price.replace('$', ''));
        return priceB - priceA;
      });
      break;
    case 'change':
      filtered.sort((a, b) => b.change24h - a.change24h);
      break;
    case 'sentiment':
      filtered.sort((a, b) => b.sentimentScore - a.sentimentScore);
      break;
    default:
      // Default to sentiment score
      filtered.sort((a, b) => b.sentimentScore - a.sentimentScore);
      break;
  }

  return filtered;
};

/**
 * Get trend statistics
 */
export const getTrendStatistics = (trendData) => {
  const totalVolume = trendData.reduce((sum, token) => {
    return sum + parseFloat(token.volume24h.replace(/[$M]/g, ''));
  }, 0);

  const avgSentiment = trendData.reduce((sum, token) => {
    return sum + token.sentimentScore;
  }, 0) / trendData.length;

  const bullishCount = trendData.filter(token => token.sentimentScore >= 70).length;
  const bearishCount = trendData.filter(token => token.sentimentScore <= 30).length;

  return {
    totalVolume: `$${totalVolume.toFixed(1)}M`,
    avgSentiment: avgSentiment.toFixed(1),
    bullishCount,
    bearishCount,
    neutralCount: trendData.length - bullishCount - bearishCount,
    trendingCount: trendData.filter(token => token.trending).length,
  };
};
