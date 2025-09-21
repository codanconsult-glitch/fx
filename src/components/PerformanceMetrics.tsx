import React from 'react';
import { BarChart3, TrendingUp, Activity, Target, Clock, Zap } from 'lucide-react';

interface PerformanceMetricsProps {
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  holdSignals: number;
  avgConfidence: number;
  signalsPerHour: number;
  totalPagesLearned: number;
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  totalSignals,
  buySignals,
  sellSignals,
  holdSignals,
  avgConfidence,
  signalsPerHour,
  totalPagesLearned
}) => {
  const metrics = [
    {
      label: 'Total Signals',
      value: totalSignals,
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      label: 'Buy Signals',
      value: buySignals,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      label: 'Avg Confidence',
      value: `${Math.round(avgConfidence * 100)}%`,
      icon: Target,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Signals/Hour',
      value: signalsPerHour.toFixed(1),
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    },
    {
      label: 'Pages Learned',
      value: totalPagesLearned,
      icon: BarChart3,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20'
    },
    {
      label: 'AI Activity',
      value: 'Active',
      icon: Zap,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        
        return (
          <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <IconComponent className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-400">
              {metric.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};