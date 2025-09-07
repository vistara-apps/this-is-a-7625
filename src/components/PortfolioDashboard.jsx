import React, { useState, useEffect } from 'react';
import { TokenDisplay } from './TokenDisplay';
import { Card } from './Card';
import { TrendingUp, TrendingDown, DollarSign, Coins, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { fetchAggregatedPortfolio, calculatePortfolioStats } from '../services/portfolioService';
import { upsertUser, getUserByAddress } from '../services/databaseService';

// Mock portfolio data
const mockPortfolioData = [
  {
    id: 1,
    symbol: 'PEPE',
    name: 'Pepe',
    chain: 'Ethereum',
    balance: '1,234,567',
    value: '$2,345.67',
    change24h: 15.2,
    logo: '🐸'
  },
  {
    id: 2,
    symbol: 'DOGE',
    name: 'Dogecoin',
    chain: 'Ethereum',
    balance: '8,901',
    value: '$1,890.23',
    change24h: -3.4,
    logo: '🐕'
  },
  {
    id: 3,
    symbol: 'SHIB',
    name: 'Shiba Inu',
    chain: 'Ethereum',
    balance: '45,678,901',
    value: '$987.65',
    change24h: 8.7,
    logo: '🐕‍🦺'
  },
  {
    id: 4,
    symbol: 'BONK',
    name: 'Bonk',
    chain: 'Solana',
    balance: '123,456,789',
    value: '$654.32',
    change24h: 22.1,
    logo: '🦴'
  }
];

export function PortfolioDashboard() {
  const [portfolioData, setPortfolioData] = useState([]);
  const [portfolioStats, setPortfolioStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  const loadPortfolioData = async (showRefreshIndicator = false) => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      // Ensure user exists in database
      let user = await getUserByAddress(address);
      if (!user) {
        user = await upsertUser({
          userId: address,
          ethAddress: address,
          connectedWallets: [address],
        });
      }

      // Fetch aggregated portfolio data
      const portfolio = await fetchAggregatedPortfolio(address);
      const stats = calculatePortfolioStats(portfolio);

      setPortfolioData(portfolio);
      setPortfolioStats(stats);
    } catch (err) {
      console.error('Failed to load portfolio:', err);
      setError('Failed to load portfolio data. Please try again.');
      
      // Fallback to mock data
      setPortfolioData(mockPortfolioData);
      setPortfolioStats(calculatePortfolioStats(mockPortfolioData));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortfolioData();
  }, [address, isConnected]);

  const handleRefresh = () => {
    loadPortfolioData(true);
  };

  const stats = portfolioStats ? [
    {
      label: 'Total Portfolio Value',
      value: portfolioStats.totalValue,
      icon: DollarSign,
      change: parseFloat(portfolioStats.change24hPercent)
    },
    {
      label: 'Total Tokens',
      value: portfolioStats.tokenCount.toString(),
      icon: Coins,
      change: null
    },
    {
      label: 'Best Performer',
      value: portfolioData.length > 0 ? `${Math.max(...portfolioData.map(t => t.change24h)).toFixed(1)}%` : '0%',
      icon: TrendingUp,
      change: null
    },
    {
      label: 'Active Chains',
      value: portfolioStats.chainCount.toString(),
      icon: TrendingDown,
      change: null
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your meme coin holdings across all chains</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={`text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-purple-400 font-medium">
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.change !== null && (
                    <div className={`flex items-center mt-2 text-sm ${
                      stat.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change >= 0 ? (
                        <TrendingUp size={16} className="mr-1" />
                      ) : (
                        <TrendingDown size={16} className="mr-1" />
                      )}
                      {Math.abs(stat.change).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Icon size={24} className="text-purple-400" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Portfolio Holdings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Your Holdings</h2>
          <div className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {portfolioData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-400">Loading portfolio...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolioData.map((token) => (
              <TokenDisplay
                key={token.id}
                token={token}
                variant="detailed"
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
