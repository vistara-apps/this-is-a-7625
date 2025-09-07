import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { PortfolioDashboard } from './components/PortfolioDashboard';
import { SwapInterface } from './components/SwapInterface';
import { TrendMonitor } from './components/TrendMonitor';
import { useAccount } from 'wagmi';

function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { isConnected } = useAccount();

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="glass-card p-8 rounded-lg max-w-md mx-auto">
            <h2 className="text-2xl font-bold gradient-text mb-4">
              Welcome to MemeSwap
            </h2>
            <p className="text-gray-300 mb-6">
              Connect your wallet to access your meme coin portfolio and start trading across multiple chains.
            </p>
            <div className="text-sm text-gray-400">
              Connect your wallet using the button in the top navigation
            </div>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'portfolio':
        return <PortfolioDashboard />;
      case 'swap':
        return <SwapInterface />;
      case 'trends':
        return <TrendMonitor />;
      default:
        return <PortfolioDashboard />;
    }
  };

  return (
    <div className="min-h-screen">
      <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
        {renderContent()}
      </AppShell>
    </div>
  );
}

export default App;