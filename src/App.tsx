import React, { useState, useEffect, useCallback } from 'react';
import { SignalCard } from './components/SignalCard';
import { LearningPanel } from './components/LearningPanel';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { BotStatus } from './components/BotStatus';
import { TradingEngine } from './services/tradingEngine';
import { WebScrapingService } from './services/webScraper';
import { TradingSignal, LearningSession, BotMemory } from './types/trading';

function App() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [isActive, setIsActive] = useState(true); // Always active now
  const [botMemory, setBotMemory] = useState<BotMemory>({
    totalPagesLearned: 0,
    lastLearningSession: new Date(),
    knowledgeScore: 0.65,
    topSources: [],
    recentInsights: []
  });

  const tradingEngine = TradingEngine.getInstance();
  const webScraper = WebScrapingService.getInstance();

  // Update signals from trading engine
  const updateSignals = useCallback(() => {
    const newSignals = tradingEngine.getSignals();
    setSignals(newSignals);
  }, [tradingEngine]);

  // Handle new learning sessions
  const handleNewLearning = useCallback((session: LearningSession) => {
    const learningHistory = webScraper.getLearningHistory();
    tradingEngine.updateLearningData(learningHistory);
    
    setBotMemory(prev => ({
      ...prev,
      totalPagesLearned: learningHistory.length,
      lastLearningSession: session.timestamp,
      knowledgeScore: Math.min(0.95, prev.knowledgeScore + 0.05),
      recentInsights: session.extractedInsights.slice(0, 3)
    }));
  }, [webScraper, tradingEngine]);

  // Bot toggle handler
  const handleBotToggle = useCallback(() => {
    // Bot is now always active, but we keep this for UI consistency
    const currentStatus = tradingEngine.getIsMonitoring();
    setIsActive(currentStatus);
  }, [tradingEngine]);

  // Update signals periodically
  useEffect(() => {
    const interval = setInterval(updateSignals, 2000); // Check every 2 seconds for new signals
    return () => clearInterval(interval);
  }, [updateSignals]);

  // Initialize monitoring status
  useEffect(() => {
    setIsActive(tradingEngine.getIsMonitoring());
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Learning Panel */}
          <div className="xl:col-span-1">
            <div className="space-y-4">
              <LearningPanel onNewLearning={handleNewLearning} />
              
              {/* Primary Source Indicator */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium text-sm">Comprehensive Market Analysis</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Monitoring 16+ sources: Economic calendar, technical analysis, market news, and trading strategies
                </p>
                <div className="mt-2 text-xs text-gray-400">
                  ✓ Economic Events • ✓ Technical Analysis • ✓ Market Sentiment • ✓ 2% Risk Management
                </div>
              </div>
            </div>
          </div>

          {/* Trading Signals */}
          <div className="xl:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Live Trading Signals</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Real-time AI Analysis</span>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
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
                      AI is continuously monitoring... Next scan in progress!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-700">
          <p>Autonomous AI Trading Bot • 16+ Market Sources • 5-Minute Monitoring • 2% Risk Management</p>
          <p className="mt-1">⚠️ For educational purposes only. Not financial advice. Always verify signals independently.</p>
        </div>
      </div>
    </div>
  );
}

export default App;