import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TradingSignal } from '../types/trading';

interface TradingTabsProps {
  xauusdSignal: TradingSignal | null;
  eurusdSignal: TradingSignal | null;
  previousSignals: TradingSignal[];
  onTabChange: (symbol: string) => void;
}

interface TPStatus {
  tp1: 'PENDING' | 'HIT' | 'MISSED';
  tp2: 'PENDING' | 'HIT' | 'MISSED';
  tp3: 'PENDING' | 'HIT' | 'MISSED';
  stopLoss: 'PENDING' | 'HIT' | 'MISSED';
  currentPrice: number;
}

export const TradingTabs: React.FC<TradingTabsProps> = ({
  xauusdSignal,
  eurusdSignal,
  previousSignals,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<'XAUUSD' | 'EURUSD' | 'HISTORY'>('XAUUSD');

  const handleTabChange = (tab: 'XAUUSD' | 'EURUSD' | 'HISTORY') => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  const getCurrentPrice = (symbol: string): number => {
    // Simulate real market prices
    if (symbol === 'XAUUSD') {
      return 2650 + (Math.random() - 0.5) * 100; // Gold price range
    } else if (symbol === 'EURUSD') {
      return 1.0550 + (Math.random() - 0.5) * 0.0200; // EUR/USD range
    }
    return 0;
  };

  const calculateTPStatus = (signal: TradingSignal): TPStatus => {
    const currentPrice = getCurrentPrice(signal.symbol);
    
    const checkTP = (tpPrice: number, signal: TradingSignal, currentPrice: number) => {
      if (signal.signal === 'BUY') {
        return currentPrice >= tpPrice ? 'HIT' : 'PENDING';
      } else {
        return currentPrice <= tpPrice ? 'HIT' : 'PENDING';
      }
    };

    const checkSL = (slPrice: number, signal: TradingSignal, currentPrice: number) => {
      if (signal.signal === 'BUY') {
        return currentPrice <= slPrice ? 'HIT' : 'PENDING';
      } else {
        return currentPrice >= slPrice ? 'HIT' : 'PENDING';
      }
    };

    return {
      tp1: checkTP(signal.takeProfit1, signal, currentPrice),
      tp2: checkTP(signal.takeProfit2, signal, currentPrice),
      tp3: checkTP(signal.takeProfit3, signal, currentPrice),
      stopLoss: checkSL(signal.stopLoss, signal, currentPrice),
      currentPrice
    };
  };

  const renderSignalCard = (signal: TradingSignal | null, symbol: string) => {
    if (!signal) {
      return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-gray-400 text-lg mb-2">No Active Signal</div>
          <div className="text-gray-500">
            AI is analyzing {symbol} market conditions...
          </div>
        </div>
      );
    }

    const tpStatus = calculateTPStatus(signal);
    const getSignalColor = (signalType: string) => {
      switch (signalType) {
        case 'BUY': return 'from-green-500 to-emerald-600';
        case 'SELL': return 'from-red-500 to-rose-600';
        default: return 'from-gray-500 to-slate-600';
      }
    };

    const getSignalIcon = (signalType: string) => {
      switch (signalType) {
        case 'BUY': return <TrendingUp className="w-6 h-6" />;
        case 'SELL': return <TrendingDown className="w-6 h-6" />;
        default: return null;
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'HIT': return <CheckCircle className="w-4 h-4 text-green-400" />;
        case 'MISSED': return <XCircle className="w-4 h-4 text-red-400" />;
        default: return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      }
    };

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        {/* Signal Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${getSignalColor(signal.signal)} text-white`}>
              {getSignalIcon(signal.signal)}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">{signal.symbol}</h3>
              <p className="text-gray-400 text-sm">Entry: ${signal.entryPrice}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${signal.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
              {signal.signal}
            </div>
            <div className="flex items-center text-gray-400 text-sm">
              <Target className="w-3 h-3 mr-1" />
              {Math.round(signal.confidence * 100)}%
            </div>
          </div>
        </div>

        {/* Current Price */}
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-blue-400 font-medium">Current Price:</span>
            <span className="text-white font-bold text-lg">
              ${tpStatus.currentPrice.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
            </span>
          </div>
        </div>

        {/* TP and SL Status */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tpStatus.tp1)}
              <span className="text-sm text-gray-300">TP1:</span>
            </div>
            <span className="text-white font-medium">
              ${signal.takeProfit1.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tpStatus.tp2)}
              <span className="text-sm text-gray-300">TP2:</span>
            </div>
            <span className="text-white font-medium">
              ${signal.takeProfit2.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tpStatus.tp3)}
              <span className="text-sm text-gray-300">TP3:</span>
            </div>
            <span className="text-white font-medium">
              ${signal.takeProfit3.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-red-600/20 border border-red-500/30 rounded">
            <div className="flex items-center space-x-2">
              {getStatusIcon(tpStatus.stopLoss)}
              <span className="text-sm text-red-300">Stop Loss:</span>
            </div>
            <span className="text-red-400 font-medium">
              ${signal.stopLoss.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
            </span>
          </div>
        </div>

        {/* Risk Management */}
        <div className="mb-4 p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-400">Risk Management:</span>
            <span className="text-orange-300 font-medium">1% Account Risk</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-orange-400">R:R Ratio:</span>
            <span className="text-orange-300 font-medium">{signal.riskRewardRatio}:1</span>
          </div>
        </div>

        {/* AI Reasoning */}
        <div className="mb-4">
          <div className="text-gray-400 text-sm mb-2">AI Analysis:</div>
          <p className="text-gray-300 text-sm leading-relaxed bg-gray-700/30 p-3 rounded">
            {signal.reasoning}
          </p>
        </div>

        {/* Signal Info */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {signal.timestamp.toLocaleTimeString()}
          </div>
          <div>{signal.source}</div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    const completedSignals = previousSignals.slice(0, 10); // Show last 10 signals
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">Previous Signals</h3>
        {completedSignals.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 text-center">
            <div className="text-gray-400">No previous signals yet</div>
          </div>
        ) : (
          completedSignals.map((signal, index) => {
            const tpStatus = calculateTPStatus(signal);
            const isWinning = tpStatus.tp1 === 'HIT' || tpStatus.tp2 === 'HIT' || tpStatus.tp3 === 'HIT';
            const isLosing = tpStatus.stopLoss === 'HIT';
            
            return (
              <div key={signal.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${signal.signal === 'BUY' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      {signal.signal === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-white font-medium">{signal.symbol}</span>
                      <span className="text-gray-400 text-sm ml-2">{signal.signal}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isWinning && <CheckCircle className="w-5 h-5 text-green-400" />}
                    {isLosing && <XCircle className="w-5 h-5 text-red-400" />}
                    {!isWinning && !isLosing && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                    <span className="text-gray-400 text-sm">
                      {signal.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-gray-400">Entry</div>
                    <div className="text-white">${signal.entryPrice}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">TP1</div>
                    <div className={`${tpStatus.tp1 === 'HIT' ? 'text-green-400' : 'text-gray-300'}`}>
                      ${signal.takeProfit1.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">TP2</div>
                    <div className={`${tpStatus.tp2 === 'HIT' ? 'text-green-400' : 'text-gray-300'}`}>
                      ${signal.takeProfit2.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">TP3</div>
                    <div className={`${tpStatus.tp3 === 'HIT' ? 'text-green-400' : 'text-gray-300'}`}>
                      ${signal.takeProfit3.toFixed(signal.symbol === 'EURUSD' ? 4 : 2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
        <button
          onClick={() => handleTabChange('XAUUSD')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'XAUUSD'
              ? 'bg-yellow-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          XAU/USD (Gold)
        </button>
        <button
          onClick={() => handleTabChange('EURUSD')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'EURUSD'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          EUR/USD
        </button>
        <button
          onClick={() => handleTabChange('HISTORY')}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'HISTORY'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'XAUUSD' && renderSignalCard(xauusdSignal, 'XAUUSD')}
        {activeTab === 'EURUSD' && renderSignalCard(eurusdSignal, 'EURUSD')}
        {activeTab === 'HISTORY' && renderHistoryTab()}
      </div>
    </div>
  );
};