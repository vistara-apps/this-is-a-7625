import React, { useState } from 'react';
import { Card } from './Card';
import { ArrowUpDown, Settings, AlertTriangle } from 'lucide-react';
import { usePaymentContext } from '../hooks/usePaymentContext';

const supportedTokens = [
  { symbol: 'PEPE', name: 'Pepe', chain: 'Ethereum', logo: '🐸' },
  { symbol: 'DOGE', name: 'Dogecoin', chain: 'Ethereum', logo: '🐕' },
  { symbol: 'SHIB', name: 'Shiba Inu', chain: 'Ethereum', logo: '🐕‍🦺' },
  { symbol: 'BONK', name: 'Bonk', chain: 'Solana', logo: '🦴' },
  { symbol: 'WIF', name: 'Dogwifhat', chain: 'Solana', logo: '🐕' },
  { symbol: 'FLOKI', name: 'Floki', chain: 'BSC', logo: '🐕' },
];

const chains = ['Ethereum', 'BSC', 'Solana', 'Base', 'Arbitrum'];

export function SwapInterface() {
  const [fromToken, setFromToken] = useState(supportedTokens[0]);
  const [toToken, setToToken] = useState(supportedTokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { createSession } = usePaymentContext();

  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsSwapping(true);
    try {
      // Process payment for swap
      await createSession();
      
      // Simulate swap execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Successfully swapped ${fromAmount} ${fromToken.symbol} to ${toAmount} ${toToken.symbol}`);
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
      alert('Swap failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleAmountChange = (value) => {
    setFromAmount(value);
    // Simulate exchange rate calculation
    if (value && !isNaN(value)) {
      const rate = Math.random() * 1000 + 100; // Mock exchange rate
      setToAmount((parseFloat(value) * rate).toFixed(6));
    } else {
      setToAmount('');
    }
  };

  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text">Cross-Chain Swap</h1>
        <p className="text-gray-400 mt-2">Trade meme coins across different blockchains</p>
      </div>

      {/* Swap Interface */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Swap Tokens</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Slippage Tolerance</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
                <span className="text-gray-400 text-sm">%</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">From</label>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <select
                  value={fromToken.symbol}
                  onChange={(e) => setFromToken(supportedTokens.find(t => t.symbol === e.target.value))}
                  className="bg-transparent text-white font-medium text-lg focus:outline-none"
                >
                  {supportedTokens.map(token => (
                    <option key={token.symbol} value={token.symbol} className="bg-slate-800">
                      {token.logo} {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="text-right">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-white text-right text-xl font-semibold focus:outline-none w-32"
                  />
                  <div className="text-xs text-gray-400 mt-1">Balance: 1,234.56</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{fromToken.chain}</span>
                <span className="text-gray-400">~$123.45</span>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapTokens}
              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
            >
              <ArrowUpDown size={20} className="text-purple-400" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">To</label>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <select
                  value={toToken.symbol}
                  onChange={(e) => setToToken(supportedTokens.find(t => t.symbol === e.target.value))}
                  className="bg-transparent text-white font-medium text-lg focus:outline-none"
                >
                  {supportedTokens.map(token => (
                    <option key={token.symbol} value={token.symbol} className="bg-slate-800">
                      {token.logo} {token.symbol}
                    </option>
                  ))}
                </select>
                <div className="text-right">
                  <div className="text-white text-xl font-semibold">
                    {toAmount || '0.0'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Balance: 0.00</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{toToken.chain}</span>
                <span className="text-gray-400">~$678.90</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Details */}
        {fromAmount && toAmount && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle size={16} className="text-yellow-400 mt-0.5" />
              <div className="space-y-2 text-sm">
                <div className="text-yellow-400 font-medium">Cross-chain swap details:</div>
                <div className="text-gray-300">
                  <div>Estimated fee: 0.5% + gas</div>
                  <div>Slippage: {slippage}%</div>
                  <div>Estimated time: 2-5 minutes</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || isSwapping}
          className="w-full mt-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
        >
          {isSwapping ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing Swap...</span>
            </div>
          ) : (
            'Swap Tokens'
          )}
        </button>
      </Card>
    </div>
  );
}