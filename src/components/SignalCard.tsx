import React from 'react';
import { TradingSignal } from '../types/trading';
import { TrendingUp, TrendingDown, Minus, Clock, Target, Brain } from 'lucide-react';

interface SignalCardProps {
  signal: TradingSignal;
  isLatest?: boolean;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, isLatest = false }) => {
  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return 'from-green-500 to-emerald-600';
      case 'SELL': return 'from-red-500 to-rose-600';
      case 'HOLD': return 'from-yellow-500 to-amber-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'BUY': return <TrendingUp className="w-5 h-5" />;
      case 'SELL': return <TrendingDown className="w-5 h-5" />;
      case 'HOLD': return <Minus className="w-5 h-5" />;
      default: return null;
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const confidencePercentage = Math.round(signal.confidence * 100);

  return (
    <div className={`relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4 transition-all duration-300 hover:border-gray-600 hover:bg-gray-800/70 ${isLatest ? 'ring-2 ring-blue-500/50 animate-pulse' : ''}`}>
      {isLatest && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          NEW
        </div>
      )}
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${getSignalColor(signal.signal)} text-white`}>
            {getSignalIcon(signal.signal)}
          </div>
          <div>
            <h3 className="text-white font-semibold">{signal.symbol}</h3>
            <p className="text-gray-400 text-sm">${signal.price}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold ${signal.signal === 'BUY' ? 'text-green-400' : signal.signal === 'SELL' ? 'text-red-400' : 'text-yellow-400'}`}>
            {signal.signal}
          </div>
          <div className="flex items-center text-gray-400 text-xs">
            <Target className="w-3 h-3 mr-1" />
            {confidencePercentage}%
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center text-gray-400 text-xs mb-2">
          <Brain className="w-3 h-3 mr-1" />
          AI Reasoning:
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{signal.reasoning}</p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {formatTime(signal.timestamp)}
        </div>
        <div className="text-gray-500">{signal.source}</div>
      </div>
    </div>
  );
};