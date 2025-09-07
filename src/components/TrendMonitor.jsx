import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { TrendCard } from './TrendCard';
import { Filter, TrendingUp, Flame, Clock } from 'lucide-react';

const mockTrendData = [
  {
    id: 1,
    symbol: 'WOJAK',
    name: 'Wojak',
    chain: 'Ethereum',
    price: '$0.000123',
    change24h: 234.5,
    volume24h: '$2.3M',
    sentiment: 'Extremely Bullish',
    sentimentScore: 95,
    marketCap: '$45M',
    logo: '😢',
    trending: true
  },
  {
    id: 2,
    symbol: 'CHAD',
    name: 'Chad Token',
    chain: 'BSC',
    price: '$0.00456',
    change24h: 156.7,
    volume24h: '$1.8M',
    sentiment: 'Very Bullish',
    sentimentScore: 87,
    marketCap: '$23M',
    logo: '💪',
    trending: true
  },
  {
    id: 3,
    symbol: 'MOON',
    name: 'Moon Token',
    chain: 'Solana',
    price: '$0.0789',
    change24h: 89.3,
    volume24h: '$967K',
    sentiment: 'Bullish',
    sentimentScore: 78,
    marketCap: '$12M',
    logo: '🌙',
    trending: false
  },
  {
    id: 4,
    symbol: 'ROCKET',
    name: 'Rocket Coin',
    chain: 'Base',
    price: '$0.0234',
    change24h: 67.8,
    volume24h: '$654K',
    sentiment: 'Bullish',
    sentimentScore: 72,
    marketCap: '$8.9M',
    logo: '🚀',
    trending: false
  },
  {
    id: 5,
    symbol: 'DIAMOND',
    name: 'Diamond Hands',
    chain: 'Arbitrum',
    price: '$0.0567',
    change24h: 45.2,
    volume24h: '$432K',
    sentiment: 'Moderate',
    sentimentScore: 65,
    marketCap: '$6.7M',
    logo: '💎',
    trending: false
  }
];

export function TrendMonitor() {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('volume');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTrendData(mockTrendData);
      setLoading(false);
    }, 1500);
  }, []);

  const filteredAndSortedData = trendData
    .filter(token => {
      if (filter === 'trending') return token.trending;
      if (filter === 'bullish') return token.sentimentScore >= 80;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') {
        return parseFloat(b.volume24h.replace(/[$M]/g, '')) - parseFloat(a.volume24h.replace(/[$M]/g, ''));
      }
      if (sortBy === 'change') {
        return b.change24h - a.change24h;
      }
      if (sortBy === 'sentiment') {
        return b.sentimentScore - a.sentimentScore;
      }
      return 0;
    });

  const stats = [
    {
      label: 'Trending Coins',
      value: trendData.filter(t => t.trending).length.toString(),
      icon: Flame,
      color: 'text-orange-400'
    },
    {
      label: 'Bullish Sentiment',
      value: `${trendData.filter(t => t.sentimentScore >= 80).length}/${trendData.length}`,
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      label: 'Last Updated',
      value: '2m ago',
      icon: Clock,
      color: 'text-blue-400'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trend Monitor</h1>
          <p className="text-gray-400 mt-1">Discover trending meme coins across all chains</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 bg-white/10 rounded-lg ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-white font-semibold">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <span className="text-gray-300 font-medium">Filter:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'trending', label: 'Trending' },
                { id: 'bullish', label: 'Bullish' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === option.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-300 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="volume" className="bg-slate-800">Volume</option>
              <option value="change" className="bg-slate-800">Price Change</option>
              <option value="sentiment" className="bg-slate-800">Sentiment</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Trending Coins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded w-24"></div>
                    <div className="h-3 bg-white/10 rounded w-16"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 bg-white/10 rounded w-full"></div>
                  <div className="h-3 bg-white/10 rounded w-3/4"></div>
                </div>
              </div>
            </Card>
          ))
        ) : filteredAndSortedData.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <div className="text-gray-400">
                <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No coins match your current filters</p>
                <p className="text-sm mt-2">Try adjusting your filter settings</p>
              </div>
            </Card>
          </div>
        ) : (
          filteredAndSortedData.map(coin => (
            <TrendCard key={coin.id} coin={coin} />
          ))
        )}
      </div>
    </div>
  );
}