import { alchemyClient, bitqueryClient, handleApiError, rateLimitedRequest } from './api.js';

/**
 * Portfolio Service - Handles fetching and aggregating portfolio data across chains
 */

// Supported chains configuration
const CHAIN_CONFIG = {
  ethereum: {
    name: 'Ethereum',
    chainId: 1,
    alchemyNetwork: 'eth-mainnet',
    bitqueryNetwork: 'ethereum',
  },
  bsc: {
    name: 'BSC',
    chainId: 56,
    alchemyNetwork: 'bnb-mainnet',
    bitqueryNetwork: 'bsc',
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    alchemyNetwork: 'polygon-mainnet',
    bitqueryNetwork: 'matic',
  },
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    alchemyNetwork: 'arb-mainnet',
    bitqueryNetwork: 'arbitrum',
  },
  base: {
    name: 'Base',
    chainId: 8453,
    alchemyNetwork: 'base-mainnet',
    bitqueryNetwork: 'base',
  },
};

/**
 * Fetch token balances for a wallet address using Alchemy
 */
export const fetchTokenBalances = async (walletAddress, chain = 'ethereum') => {
  try {
    const chainConfig = CHAIN_CONFIG[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const response = await rateLimitedRequest(async () => {
      return await alchemyClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [walletAddress, 'erc20'],
      });
    });

    const { result } = response.data;
    
    // Filter out zero balances and format the data
    const nonZeroBalances = result.tokenBalances
      .filter(token => token.tokenBalance !== '0x0')
      .map(token => ({
        contractAddress: token.contractAddress,
        balance: parseInt(token.tokenBalance, 16),
        chain: chainConfig.name,
      }));

    return nonZeroBalances;
  } catch (error) {
    handleApiError(error, 'Portfolio Service - Token Balances');
    return [];
  }
};

/**
 * Fetch token metadata using Alchemy
 */
export const fetchTokenMetadata = async (contractAddresses, chain = 'ethereum') => {
  try {
    const chainConfig = CHAIN_CONFIG[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const metadataPromises = contractAddresses.map(address =>
      rateLimitedRequest(async () => {
        return await alchemyClient.post('', {
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [address],
        });
      })
    );

    const responses = await Promise.allSettled(metadataPromises);
    
    return responses.map((response, index) => {
      if (response.status === 'fulfilled') {
        const { result } = response.value.data;
        return {
          contractAddress: contractAddresses[index],
          name: result.name,
          symbol: result.symbol,
          decimals: result.decimals,
          logo: result.logo,
          chain: chainConfig.name,
        };
      }
      return {
        contractAddress: contractAddresses[index],
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        logo: null,
        chain: chainConfig.name,
      };
    });
  } catch (error) {
    handleApiError(error, 'Portfolio Service - Token Metadata');
    return [];
  }
};

/**
 * Fetch token prices using Bitquery
 */
export const fetchTokenPrices = async (contractAddresses, chain = 'ethereum') => {
  try {
    const chainConfig = CHAIN_CONFIG[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    const query = `
      query GetTokenPrices($network: EthereumNetwork!, $addresses: [String!]!) {
        ethereum(network: $network) {
          dexTrades(
            options: {limit: 1, desc: "block.timestamp.time"}
            baseCurrency: {in: $addresses}
            quoteCurrency: {is: "0xdac17f958d2ee523a2206206994597c13d831ec7"}
          ) {
            baseCurrency {
              address
              symbol
              name
            }
            quotePrice
            block {
              timestamp {
                time
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
          network: chainConfig.bitqueryNetwork,
          addresses: contractAddresses,
        },
      });
    });

    const trades = response.data.data?.ethereum?.dexTrades || [];
    
    return trades.map(trade => ({
      contractAddress: trade.baseCurrency.address,
      symbol: trade.baseCurrency.symbol,
      name: trade.baseCurrency.name,
      price: trade.quotePrice,
      lastUpdated: trade.block.timestamp.time,
      chain: chainConfig.name,
    }));
  } catch (error) {
    console.warn('Bitquery API failed, using fallback prices:', error.message);
    // Return mock prices as fallback
    return contractAddresses.map(address => ({
      contractAddress: address,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      price: Math.random() * 0.01, // Random price between 0-0.01
      lastUpdated: new Date().toISOString(),
      chain: chainConfig.name,
    }));
  }
};

/**
 * Aggregate portfolio data across all supported chains
 */
export const fetchAggregatedPortfolio = async (walletAddress) => {
  try {
    const chainKeys = Object.keys(CHAIN_CONFIG);
    
    // Fetch balances from all chains in parallel
    const balancePromises = chainKeys.map(chain =>
      fetchTokenBalances(walletAddress, chain)
    );
    
    const allBalances = await Promise.allSettled(balancePromises);
    
    // Flatten and combine all balances
    const combinedBalances = allBalances
      .filter(result => result.status === 'fulfilled')
      .flatMap((result, index) => 
        result.value.map(balance => ({
          ...balance,
          chain: chainKeys[index],
        }))
      );

    if (combinedBalances.length === 0) {
      return [];
    }

    // Get unique contract addresses for metadata and price fetching
    const uniqueAddresses = [...new Set(combinedBalances.map(b => b.contractAddress))];
    
    // Fetch metadata and prices
    const metadataPromises = chainKeys.map(chain => {
      const chainAddresses = combinedBalances
        .filter(b => b.chain === chain)
        .map(b => b.contractAddress);
      
      if (chainAddresses.length === 0) return Promise.resolve([]);
      
      return fetchTokenMetadata(chainAddresses, chain);
    });

    const pricePromises = chainKeys.map(chain => {
      const chainAddresses = combinedBalances
        .filter(b => b.chain === chain)
        .map(b => b.contractAddress);
      
      if (chainAddresses.length === 0) return Promise.resolve([]);
      
      return fetchTokenPrices(chainAddresses, chain);
    });

    const [metadataResults, priceResults] = await Promise.all([
      Promise.allSettled(metadataPromises),
      Promise.allSettled(pricePromises),
    ]);

    // Combine metadata and prices
    const allMetadata = metadataResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    const allPrices = priceResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    // Create final portfolio data
    const portfolioData = combinedBalances.map(balance => {
      const metadata = allMetadata.find(m => 
        m.contractAddress.toLowerCase() === balance.contractAddress.toLowerCase() &&
        m.chain === CHAIN_CONFIG[balance.chain].name
      );
      
      const priceData = allPrices.find(p => 
        p.contractAddress.toLowerCase() === balance.contractAddress.toLowerCase() &&
        p.chain === CHAIN_CONFIG[balance.chain].name
      );

      const decimals = metadata?.decimals || 18;
      const actualBalance = balance.balance / Math.pow(10, decimals);
      const price = priceData?.price || 0;
      const value = actualBalance * price;

      return {
        id: `${balance.contractAddress}-${balance.chain}`,
        contractAddress: balance.contractAddress,
        symbol: metadata?.symbol || 'UNKNOWN',
        name: metadata?.name || 'Unknown Token',
        chain: CHAIN_CONFIG[balance.chain].name,
        balance: actualBalance.toLocaleString(),
        value: `$${value.toFixed(2)}`,
        price: `$${price.toFixed(6)}`,
        logo: metadata?.logo || '🪙',
        change24h: (Math.random() - 0.5) * 20, // Mock 24h change
        lastUpdated: priceData?.lastUpdated || new Date().toISOString(),
      };
    });

    return portfolioData.sort((a, b) => 
      parseFloat(b.value.replace('$', '')) - parseFloat(a.value.replace('$', ''))
    );

  } catch (error) {
    handleApiError(error, 'Portfolio Service - Aggregated Portfolio');
    return [];
  }
};

/**
 * Calculate portfolio statistics
 */
export const calculatePortfolioStats = (portfolioData) => {
  const totalValue = portfolioData.reduce((sum, token) => {
    return sum + parseFloat(token.value.replace('$', ''));
  }, 0);

  const totalChange24h = portfolioData.reduce((sum, token) => {
    const tokenValue = parseFloat(token.value.replace('$', ''));
    return sum + (tokenValue * token.change24h / 100);
  }, 0);

  const change24hPercent = totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0;

  return {
    totalValue: `$${totalValue.toFixed(2)}`,
    totalChange24h: `$${totalChange24h.toFixed(2)}`,
    change24hPercent: change24hPercent.toFixed(2),
    tokenCount: portfolioData.length,
    chainCount: [...new Set(portfolioData.map(token => token.chain))].length,
  };
};
