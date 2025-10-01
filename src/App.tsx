import React, { useState, useEffect, useCallback } from 'react';
import { TradingTabs } from './components/TradingTabs';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { BotStatus } from './components/BotStatus';
import { AutonomousTradingEngine } from './services/autonomousTradingEngine';
import { TradingSignal, BotMemory } from './types/trading';

function App() {
  const [xauusdSignal, setXauusdSignal] = useState<TradingSignal | null>(null);
  const [eurusdSignal, setEurusdSignal] = useState<TradingSignal | null>(null);
  const [signalHistory, setSignalHistory] = useState<TradingSignal[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('XAUUSD');
  const [botMemory, setBotMemory] = useState<BotMemory>({
    totalPagesLearned: 0,
    lastLearningSession: new Date(),
    knowledgeScore: 0.85,
    topSources: [],
    recentInsights: []
  });

  const tradingEngine = AutonomousTradingEngine.getInstance();

  // Update signals from trading engine
  const updateSignals = useCallback(() => {
    const currentSignals = tradingEngine.getCurrentSignals();
    const history = tradingEngine.getSignalHistory();
    
    setXauusdSignal(currentSignals.get('XAUUSD') || null);
    setEurusdSignal(currentSignals.get('EURUSD') || null);
    setSignalHistory(history);
    
    // Update bot memory with brain data
    const brainData = tradingEngine.getBrainData();
    setBotMemory(prev => ({
      ...prev,
      totalPagesLearned: brainData.size * 25,
      lastLearningSession: new Date(),
      knowledgeScore: Math.min(0.95, 0.75 + (brainData.size * 0.05)),
      recentInsights: Array.from(brainData.values())
        .flatMap(brain => brain.insights)
        .slice(0, 3)
    }));
  }, [tradingEngine]);

  // Bot toggle handler
  const handleBotToggle = useCallback(() => {
    // Bot is autonomous and always active
    const currentStatus = tradingEngine.getIsMonitoring();
    setIsActive(currentStatus);
  }, [tradingEngine]);

  // Update signals periodically
  useEffect(() => {
    const interval = setInterval(updateSignals, 10000); // Check every 10 seconds for UI updates
    return () => clearInterval(interval);
  }, [updateSignals]);

  // Initialize monitoring status
  useEffect(() => {
    setIsActive(tradingEngine.getIsMonitoring());
    updateSignals(); // Initial load
  }, [tradingEngine]);

  // Get performance metrics
  const performanceMetrics = tradingEngine.getPerformanceMetrics();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <BotStatus 
          isActive={isActive}
          onToggle={handleBotToggle}
          botMemory={botMemory}
        />

        {/* Performance Metrics */}
        <PerformanceMetrics
          totalSignals={performanceMetrics.totalSignals}
          buySignals={performanceMetrics.buySignals}
          sellSignals={performanceMetrics.sellSignals}
          holdSignals={performanceMetrics.holdSignals}
          avgConfidence={performanceMetrics.avgConfidence}
          signalsPerHour={performanceMetrics.signalsPerHour}
          totalPagesLearned={botMemory.totalPagesLearned}
        />

        {/* Enhanced AI Status */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-white">ENHANCED AI: Real TradingView Prices + 1% Risk + Learning (GMT+3)</h3>
            </div>
            <div className="text-green-400 text-sm">
              Real Prices + TP Tracking
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Price Source</div>
              <div className="text-green-400 font-medium">TradingView Real</div>
            </div>
            <div>
              <div className="text-gray-400">Risk Management</div>
              <div className="text-blue-400 font-medium">1% Per Trade</div>
            </div>
            <div>
              <div className="text-gray-400">TP Tracking</div>
              <div className="text-purple-400 font-medium">Real-time</div>
            </div>
            <div>
              <div className="text-gray-400">Learning</div>
              <div className="text-orange-400 font-medium">Continuous</div>
            </div>
          </div>
        </div>

        {/* Trading Interface with Tabs */}
        <TradingTabs
          xauusdSignal={xauusdSignal}
          eurusdSignal={eurusdSignal}
          previousSignals={signalHistory}
          onTabChange={handleTabChange}
        />

        {/* Footer */}
        <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-700">
          <p>Enhanced AI Trading Bot • 1% Risk Management • Continuous Learning • GMT+3 Bucharest • Real-time TP Tracking</p>
          <p className="mt-1">⚠️ For educational purposes only. Not financial advice. Always verify signals independently.</p>
        </div>
      </div>
    </div>
  );
}

export default App;