import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TokenDisplay({ token, variant = 'compact' }) {
  const isPositive = token.change24h >= 0;

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-lg">
            {token.logo}
          </div>
          <div>
            <div className="font-medium text-white">{token.symbol}</div>
            <div className="text-xs text-gray-400">{token.chain}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium text-white">{token.value}</div>
          <div className={`text-xs flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="ml-1">{Math.abs(token.change24h).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xl">
            {token.logo}
          </div>
          <div>
            <div className="font-semibold text-white text-lg">{token.symbol}</div>
            <div className="text-gray-400">{token.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-white text-xl">{token.value}</div>
          <div className={`flex items-center justify-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1 font-medium">{Math.abs(token.change24h).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Balance</div>
          <div className="text-white font-medium">{token.balance}</div>
        </div>
        <div>
          <div className="text-gray-400">Chain</div>
          <div className="text-white font-medium">{token.chain}</div>
        </div>
      </div>
    </div>
  );
}