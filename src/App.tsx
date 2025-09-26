import React, { useState, useEffect, useCallback } from 'react';
import { SignalCard } from './components/SignalCard';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { BotStatus } from './components/BotStatus';
import { AutonomousTradingEngine } from './services/autonomousTradingEngine';
import { TradingSignal, BotMemory } from './types/trading';

function App() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isActive, setIsActive] = useState(true);
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
    const newSignals = tradingEngine.getSignals();
    setSignals(newSignals);
    
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
    const interval = setInterval(updateSignals, 30000); // Check every 30 seconds for UI updates
    return () => clearInterval(interval);
  }, [updateSignals]);

  // Initialize monitoring status
  useEffect(() => {
    setIsActive(tradingEngine.getIsMonitoring());
    updateSignals(); // Initial load
  }, [tradingEngine]);

  // Get performance metrics
  const performanceMetrics = tradingEngine.getPerformanceMetrics();

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

        {/* Autonomous Brain Status */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold text-white">ENHANCED AI: Barchart + TradingView + Learning (GMT+3)</h3>
            </div>
            <div className="text-green-400 text-sm">
              Enhanced AI + Learning Engine + Supabase
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Content Sources</div>
              <div className="text-white font-medium">Barchart + TradingView</div>
            </div>
            <div>
              <div className="text-gray-400">Analysis Frequency</div>
              <div className="text-purple-400 font-medium">Every 10 min</div>
            </div>
            <div>
              <div className="text-gray-400">Risk Management</div>
              <div className="text-blue-400 font-medium">2% Adaptive</div>
            </div>
            <div>
              <div className="text-gray-400">Signal Quality</div>
              <div className="text-orange-400 font-medium">Learning AI</div>
            </div>
          </div>
        </div>

        {/* Trading Signals */}
        <div className="w-full">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Live Trading Signals</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Enhanced AI + TradingView Sentiment + Learning</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto">
              {signals.length > 0 ? (
                signals.map((signal, index) => (
                  <SignalCard 
                    key={signal.id} 
                    signal={signal} 
                    isLatest={index === 0 && isActive}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">No signals yet</div>
                  <div className="text-gray-500">
                    Enhanced AI is analyzing Barchart + TradingView expert sentiment + learning from outcomes... High-quality signals every 10 minutes!
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-700">
          <p>Enhanced AI Trading Bot • Barchart + TradingView • Learning Engine • GMT+3 • 2% Adaptive Risk • 10-Min Signals</p>
          <p className="mt-1">⚠️ For educational purposes only. Not financial advice. Always verify signals independently.</p>
        </div>
      </div>
    </div>
  );
}

export default App;