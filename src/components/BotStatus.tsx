import React from 'react';
import { Bot, Power, Pause, Play, Activity, Clock } from 'lucide-react';

interface BotStatusProps {
  isActive: boolean; // This will always be true now since monitoring is continuous
  onToggle: () => void;
  botMemory: {
    totalPagesLearned: number;
    lastLearningSession: Date;
    knowledgeScore: number;
  };
}

export const BotStatus: React.FC<BotStatusProps> = ({ isActive, onToggle, botMemory }) => {
  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${isActive ? 'bg-green-500/20 animate-pulse' : 'bg-gray-600/20'}`}>
            <Bot className={`w-8 h-8 ${isActive ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white">AI Trading Bot</h1>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-green-400">
                Continuous Monitoring Active
              </span>
              <Clock className="w-3 h-3 text-green-400" />
              <span className="text-green-400 text-xs">Every 5 min</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-white font-semibold">Knowledge Score: {Math.round(botMemory.knowledgeScore * 100)}%</div>
            <div className="text-gray-400 text-sm">
              {botMemory.totalPagesLearned} pages learned
            </div>
          </div>
          
          <div className="flex items-center space-x-2 px-6 py-3 bg-green-600/20 border border-green-500/30 rounded-lg">
            <Activity className="w-5 h-5 text-green-400 animate-pulse" />
            <span className="text-green-400 font-medium">Auto-Monitoring</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center space-x-2 text-green-400">
        <Activity className="w-4 h-4 animate-bounce" />
        <span className="text-sm">AI continuously monitors Barchart XAUUSD & EURUSD every 5 minutes...</span>
      </div>
    </div>
  );
};