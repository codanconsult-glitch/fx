import React from 'react';
import { Bot, Power, Pause, Play, Activity } from 'lucide-react';

interface BotStatusProps {
  isActive: boolean;
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
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
              <span className={isActive ? 'text-green-400' : 'text-gray-400'}>
                {isActive ? 'Actively Learning & Trading' : 'Standby Mode'}
              </span>
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
          
          <button
            onClick={onToggle}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              isActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Stop Bot</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Start Bot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 flex items-center space-x-2 text-green-400">
          <Activity className="w-4 h-4 animate-bounce" />
          <span className="text-sm">AI is continuously learning and generating signals...</span>
        </div>
      )}
    </div>
  );
};