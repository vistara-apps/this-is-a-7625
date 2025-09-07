import { alchemyClient, handleApiError, rateLimitedRequest } from './api.js';

/**
 * Swap Service - Handles cross-chain swap functionality
 */

// Cross-chain bridge and DEX aggregator configurations
const SWAP_PROVIDERS = {
  '1inch': {
    name: '1inch',
    baseUrl: 'https://api.1inch.io/v5.0',
    supportedChains: [1, 56, 137, 42161, 8453], // Ethereum, BSC, Polygon, Arbitrum, Base
  },
  'paraswap': {
    name: 'ParaSwap',
    baseUrl: 'https://apiv5.paraswap.io',
    supportedChains: [1, 56, 137, 42161],
  },
  'lifi': {
    name: 'LiFi',
    baseUrl: 'https://li.quest/v1',
    supportedChains: [1, 56, 137, 42161, 8453, 10], // Includes Optimism
  },
};

// Chain configurations for cross-chain swaps
const CHAIN_CONFIG = {
  1: { name: 'Ethereum', symbol: 'ETH', rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/' },
  56: { name: 'BSC', symbol: 'BNB', rpcUrl: 'https://bsc-dataseed.binance.org/' },
  137: { name: 'Polygon', symbol: 'MATIC', rpcUrl: 'https://polygon-rpc.com/' },
  42161: { name: 'Arbitrum', symbol: 'ETH', rpcUrl: 'https://arb1.arbitrum.io/rpc' },
  8453: { name: 'Base', symbol: 'ETH', rpcUrl: 'https://mainnet.base.org/' },
  10: { name: 'Optimism', symbol: 'ETH', rpcUrl: 'https://mainnet.optimism.io/' },
};

/**
 * Get available tokens for swapping on a specific chain
 */
export const getAvailableTokens = async (chainId) => {
  try {
    // For demo purposes, return a curated list of popular meme coins
    const tokensByChain = {
      1: [ // Ethereum
        {
          address: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
          symbol: 'PEPE',
          name: 'Pepe',
          decimals: 18,
          logo: '🐸',
        },
        {
          address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
          symbol: 'SHIB',
          name: 'Shiba Inu',
          decimals: 18,
          logo: '🐕‍🦺',
        },
        {
          address: '0x4d224452801aced8b2f0aebe155379bb5d594381',
          symbol: 'APE',
          name: 'ApeCoin',
          decimals: 18,
          logo: '🦍',
        },
      ],
      56: [ // BSC
        {
          address: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
          symbol: 'ETH',
          name: 'Ethereum Token',
          decimals: 18,
          logo: '⚡',
        },
        {
          address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 18,
          logo: '💵',
        },
      ],
      137: [ // Polygon
        {
          address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          logo: '💵',
        },
      ],
      42161: [ // Arbitrum
        {
          address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          logo: '💵',
        },
      ],
      8453: [ // Base
        {
          address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          logo: '💵',
        },
      ],
    };

    return tokensByChain[chainId] || [];
  } catch (error) {
    handleApiError(error, 'Swap Service - Available Tokens');
    return [];
  }
};

/**
 * Get swap quote using 1inch API
 */
export const getSwapQuote = async (params) => {
  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromChainId,
    toChainId,
    slippage = 1,
    userAddress,
  } = params;

  try {
    // Check if it's a cross-chain swap
    const isCrossChain = fromChainId !== toChainId;

    if (isCrossChain) {
      return await getCrossChainQuote(params);
    }

    // Same-chain swap using 1inch
    const provider = SWAP_PROVIDERS['1inch'];
    const baseUrl = `${provider.baseUrl}/${fromChainId}`;

    const quoteParams = new URLSearchParams({
      fromTokenAddress,
      toTokenAddress,
      amount,
      slippage,
    });

    const response = await rateLimitedRequest(async () => {
      return await fetch(`${baseUrl}/quote?${quoteParams}`);
    });

    if (!response.ok) {
      throw new Error(`1inch API error: ${response.status}`);
    }

    const quoteData = await response.json();

    return {
      fromToken: {
        address: fromTokenAddress,
        amount: amount,
        chainId: fromChainId,
      },
      toToken: {
        address: toTokenAddress,
        amount: quoteData.toTokenAmount,
        chainId: toChainId,
      },
      estimatedGas: quoteData.estimatedGas,
      protocols: quoteData.protocols,
      slippage,
      isCrossChain: false,
      provider: '1inch',
      priceImpact: calculatePriceImpact(amount, quoteData.toTokenAmount),
    };

  } catch (error) {
    console.warn('1inch quote failed, using fallback:', error.message);
    return getFallbackQuote(params);
  }
};

/**
 * Get cross-chain swap quote using LiFi
 */
export const getCrossChainQuote = async (params) => {
  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromChainId,
    toChainId,
    slippage = 1,
    userAddress,
  } = params;

  try {
    const provider = SWAP_PROVIDERS.lifi;
    const requestBody = {
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: fromTokenAddress,
      toToken: toTokenAddress,
      fromAmount: amount,
      fromAddress: userAddress,
      toAddress: userAddress,
      slippage: slippage / 100, // LiFi expects decimal format
    };

    const response = await rateLimitedRequest(async () => {
      return await fetch(`${provider.baseUrl}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    });

    if (!response.ok) {
      throw new Error(`LiFi API error: ${response.status}`);
    }

    const quoteData = await response.json();

    return {
      fromToken: {
        address: fromTokenAddress,
        amount: amount,
        chainId: fromChainId,
      },
      toToken: {
        address: toTokenAddress,
        amount: quoteData.estimate.toAmount,
        chainId: toChainId,
      },
      estimatedGas: quoteData.estimate.gasCosts?.[0]?.estimate || '0',
      bridgeFee: quoteData.estimate.feeCosts?.[0]?.amount || '0',
      executionTime: quoteData.estimate.executionDuration || 300, // seconds
      slippage,
      isCrossChain: true,
      provider: 'LiFi',
      priceImpact: calculatePriceImpact(amount, quoteData.estimate.toAmount),
      route: quoteData.toolDetails,
    };

  } catch (error) {
    console.warn('LiFi cross-chain quote failed, using fallback:', error.message);
    return getFallbackQuote(params);
  }
};

/**
 * Execute swap transaction
 */
export const executeSwap = async (quoteData, userAddress, signer) => {
  try {
    const { isCrossChain, provider } = quoteData;

    if (isCrossChain) {
      return await executeCrossChainSwap(quoteData, userAddress, signer);
    }

    // Same-chain swap execution
    if (provider === '1inch') {
      return await execute1inchSwap(quoteData, userAddress, signer);
    }

    throw new Error(`Unsupported swap provider: ${provider}`);

  } catch (error) {
    handleApiError(error, 'Swap Service - Execute Swap');
    throw error;
  }
};

/**
 * Execute 1inch swap
 */
const execute1inchSwap = async (quoteData, userAddress, signer) => {
  try {
    const { fromToken, toToken, slippage } = quoteData;
    const provider = SWAP_PROVIDERS['1inch'];
    const baseUrl = `${provider.baseUrl}/${fromToken.chainId}`;

    const swapParams = new URLSearchParams({
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      amount: fromToken.amount,
      fromAddress: userAddress,
      slippage,
      disableEstimate: true,
    });

    const response = await rateLimitedRequest(async () => {
      return await fetch(`${baseUrl}/swap?${swapParams}`);
    });

    if (!response.ok) {
      throw new Error(`1inch swap API error: ${response.status}`);
    }

    const swapData = await response.json();

    // Execute the transaction using the signer
    const txResponse = await signer.sendTransaction({
      to: swapData.tx.to,
      data: swapData.tx.data,
      value: swapData.tx.value,
      gasLimit: swapData.tx.gas,
      gasPrice: swapData.tx.gasPrice,
    });

    return {
      hash: txResponse.hash,
      status: 'pending',
      provider: '1inch',
      isCrossChain: false,
    };

  } catch (error) {
    throw new Error(`1inch swap execution failed: ${error.message}`);
  }
};

/**
 * Execute cross-chain swap using LiFi
 */
const executeCrossChainSwap = async (quoteData, userAddress, signer) => {
  try {
    // For cross-chain swaps, we would typically:
    // 1. Get the transaction data from LiFi
    // 2. Execute the initial transaction on the source chain
    // 3. Monitor the bridge process
    // 4. Return transaction details

    // Simplified implementation for demo
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    return {
      hash: mockTxHash,
      status: 'pending',
      provider: 'LiFi',
      isCrossChain: true,
      estimatedTime: quoteData.executionTime,
      bridgeStatus: 'initiated',
    };

  } catch (error) {
    throw new Error(`Cross-chain swap execution failed: ${error.message}`);
  }
};

/**
 * Monitor swap transaction status
 */
export const monitorSwapStatus = async (transactionHash, chainId) => {
  try {
    // Use Alchemy to check transaction status
    const response = await rateLimitedRequest(async () => {
      return await alchemyClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [transactionHash],
      });
    });

    const receipt = response.data.result;

    if (!receipt) {
      return { status: 'pending' };
    }

    const success = receipt.status === '0x1';

    return {
      status: success ? 'completed' : 'failed',
      blockNumber: parseInt(receipt.blockNumber, 16),
      gasUsed: parseInt(receipt.gasUsed, 16),
      transactionHash: receipt.transactionHash,
    };

  } catch (error) {
    console.warn('Transaction monitoring failed:', error.message);
    return { status: 'unknown' };
  }
};

/**
 * Calculate price impact
 */
const calculatePriceImpact = (inputAmount, outputAmount) => {
  // Simplified price impact calculation
  // In reality, this would require more complex calculations
  const impact = Math.abs((inputAmount - outputAmount) / inputAmount) * 100;
  return Math.min(impact, 50); // Cap at 50%
};

/**
 * Get fallback quote when APIs fail
 */
const getFallbackQuote = (params) => {
  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromChainId,
    toChainId,
    slippage = 1,
  } = params;

  // Mock quote with reasonable estimates
  const mockOutputAmount = (parseFloat(amount) * 0.95).toString(); // 5% slippage

  return {
    fromToken: {
      address: fromTokenAddress,
      amount: amount,
      chainId: fromChainId,
    },
    toToken: {
      address: toTokenAddress,
      amount: mockOutputAmount,
      chainId: toChainId,
    },
    estimatedGas: '150000',
    bridgeFee: fromChainId !== toChainId ? '0.001' : '0',
    executionTime: fromChainId !== toChainId ? 300 : 30,
    slippage,
    isCrossChain: fromChainId !== toChainId,
    provider: 'Fallback',
    priceImpact: 5.0,
    warning: 'Using fallback quote - actual rates may vary',
  };
};

/**
 * Get supported chains for swapping
 */
export const getSupportedChains = () => {
  return Object.entries(CHAIN_CONFIG).map(([chainId, config]) => ({
    chainId: parseInt(chainId),
    name: config.name,
    symbol: config.symbol,
    logo: getChainLogo(config.name),
  }));
};

/**
 * Get chain logo emoji
 */
const getChainLogo = (chainName) => {
  const logoMap = {
    'Ethereum': '⚡',
    'BSC': '🟡',
    'Polygon': '🟣',
    'Arbitrum': '🔵',
    'Base': '🔷',
    'Optimism': '🔴',
  };
  
  return logoMap[chainName] || '⚪';
};

/**
 * Validate swap parameters
 */
export const validateSwapParams = (params) => {
  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromChainId,
    toChainId,
    userAddress,
  } = params;

  const errors = [];

  if (!fromTokenAddress || fromTokenAddress === '0x0') {
    errors.push('Invalid from token address');
  }

  if (!toTokenAddress || toTokenAddress === '0x0') {
    errors.push('Invalid to token address');
  }

  if (!amount || parseFloat(amount) <= 0) {
    errors.push('Invalid amount');
  }

  if (!fromChainId || !CHAIN_CONFIG[fromChainId]) {
    errors.push('Unsupported from chain');
  }

  if (!toChainId || !CHAIN_CONFIG[toChainId]) {
    errors.push('Unsupported to chain');
  }

  if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
    errors.push('Invalid user address');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get swap history for a user
 */
export const getSwapHistory = async (userAddress, limit = 10) => {
  try {
    // In a real implementation, this would fetch from a database
    // For now, return mock data
    const mockHistory = [
      {
        id: '1',
        hash: '0x1234...5678',
        fromToken: { symbol: 'PEPE', amount: '1000000', chain: 'Ethereum' },
        toToken: { symbol: 'SHIB', amount: '500000', chain: 'Ethereum' },
        status: 'completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        fee: '$2.50',
      },
      {
        id: '2',
        hash: '0x9876...5432',
        fromToken: { symbol: 'DOGE', amount: '100', chain: 'BSC' },
        toToken: { symbol: 'BONK', amount: '50000', chain: 'Solana' },
        status: 'completed',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        fee: '$5.00',
        isCrossChain: true,
      },
    ];

    return mockHistory.slice(0, limit);

  } catch (error) {
    handleApiError(error, 'Swap Service - History');
    return [];
  }
};
