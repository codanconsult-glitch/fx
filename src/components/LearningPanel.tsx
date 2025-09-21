import React, { useState, useCallback } from 'react';
import { WebScrapingService } from '../services/webScraper';
import { LearningSession } from '../types/trading';
import { Globe, Plus, Brain, Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface LearningPanelProps {
  onNewLearning: (session: LearningSession) => void;
}

export const LearningPanel: React.FC<LearningPanelProps> = ({ onNewLearning }) => {
  const [url, setUrl] = useState('');
  const [isLearning, setIsLearning] = useState(false);
  const [lastResult, setLastResult] = useState<LearningSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scraper = WebScrapingService.getInstance();

  const handleLearnFromUrl = useCallback(async () => {
    if (!url.trim()) return;
    
    setIsLearning(true);
    setError(null);
    
    try {
      const session = await scraper.scrapeWebpage(url.trim());
      setLastResult(session);
      onNewLearning(session);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to learn from webpage');
    } finally {
      setIsLearning(false);
    }
  }, [url, onNewLearning, scraper]);

  const handleQuickLearn = useCallback(async () => {
    const sampleUrls = [
      'https://coindesk.com/markets/bitcoin-analysis',
      'https://finviz.com/news/crypto-market-update',
      'https://marketwatch.com/investing/stock-analysis',
      'https://bloomberg.com/technology-earnings'
    ];
    
    const randomUrl = sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
    setUrl(randomUrl);
    
    setIsLearning(true);
    setError(null);
    
    try {
      const session = await scraper.scrapeWebpage(randomUrl);
      setLastResult(session);
      onNewLearning(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to learn from webpage');
    } finally {
      setIsLearning(false);
      setUrl('');
    }
  }, [onNewLearning, scraper]);

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">AI Learning Center</h2>
          <p className="text-gray-400 text-sm">Feed me URLs to enhance trading intelligence</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter webpage URL to learn from..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              disabled={isLearning}
              onKeyPress={(e) => e.key === 'Enter' && !isLearning && handleLearnFromUrl()}
            />
          </div>
          <button
            onClick={handleLearnFromUrl}
            disabled={!url.trim() || isLearning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isLearning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Learning...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Learn</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleQuickLearn}
          disabled={isLearning}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
        >
          <Zap className="w-4 h-4" />
          <span>Quick Learn from Random Source</span>
        </button>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {lastResult && (
          <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Successfully Learned!</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <Clock className="w-4 h-4 mr-2" />
                Processed in {lastResult.processingTime}ms
              </div>
              
              <div className="text-gray-300">
                <strong>Insights Extracted:</strong>
                <ul className="mt-1 ml-4 space-y-1">
                  {lastResult.extractedInsights.map((insight, index) => (
                    <li key={index} className="text-gray-400">• {insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};