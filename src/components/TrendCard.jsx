import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown, Flame, Eye } from 'lucide-react';

export function TrendCard({ coin }) {
  const isPositive = coin.change24h >= 0;
  
  const getSentimentColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSentimentBg = (score) => {
    if (score >= 80) return 'bg-green-400/20 border-green-400/30';
    if (score >= 60) return 'bg-yellow-400/20 border-yellow-400/30';
    return 'bg-red-400/20 border-red-400/30';
  };

  return (
    <Card className="p-6 hover:bg-white/10 transition-all duration-200 cursor-pointer group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xl relative">
            {coin.logo}
            {coin.trending && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <Flame size={12} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-lg">{coin.symbol}</span>
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                {coin.chain}
              </span>
            </div>
            <div className="text-gray-400 text-sm">{coin.name}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="font-bold text-white text-xl">{coin.price}</div>
          <div className={`flex items-center justify-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1 font-medium">+{coin.change24h.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Sentiment */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Market Sentiment</span>
          <span className={`text-sm font-medium ${getSentimentColor(coin.sentimentScore)}`}>
            {coin.sentiment}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getSentimentColor(coin.sentimentScore).replace('text-', 'bg-')}`}
            style={{ width: `${coin.sentimentScore}%` }}
          ></div>
        </div>
        <div className="text-right text-xs text-gray-400 mt-1">
          {coin.sentimentScore}/100
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400 mb-1">24h Volume</div>
          <div className="text-white font-semibold">{coin.volume24h}</div>
        </div>
        <div>
          <div className="text-gray-400 mb-1">Market Cap</div>
          <div className="text-white font-semibold">{coin.marketCap}</div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <button className="w-full py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 text-purple-300 font-medium rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 group-hover:border-purple-400/50">
          <Eye size={16} />
          <span>View Details</span>
        </button>
      </div>
    </Card>
  );
}