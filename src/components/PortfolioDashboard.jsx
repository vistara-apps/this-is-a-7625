import React, { useState, useEffect } from 'react';
import { TokenDisplay } from './TokenDisplay';
import { Card } from './Card';
import { TrendingUp, TrendingDown, DollarSign, Coins } from 'lucide-react';

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
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange, setTotalChange] = useState(0);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPortfolioData(mockPortfolioData);
      
      // Calculate totals
      const total = mockPortfolioData.reduce((sum, token) => {
        return sum + parseFloat(token.value.replace('$', '').replace(',', ''));
      }, 0);
      
      const weightedChange = mockPortfolioData.reduce((sum, token) => {
        const value = parseFloat(token.value.replace('$', '').replace(',', ''));
        return sum + (token.change24h * (value / total));
      }, 0);
      
      setTotalValue(total);
      setTotalChange(weightedChange);
    }, 1000);
  }, []);

  const stats = [
    {
      label: 'Total Portfolio Value',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      change: totalChange
    },
    {
      label: 'Total Tokens',
      value: portfolioData.length.toString(),
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
      value: [...new Set(portfolioData.map(t => t.chain))].length.toString(),
      icon: TrendingDown,
      change: null
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
          <p className="text-gray-400 mt-1">Track your meme coin holdings across all chains</p>
        </div>
      </div>

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