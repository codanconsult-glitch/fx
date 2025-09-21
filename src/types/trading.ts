export interface TradingSignal {
  id: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  price: number;
  timestamp: Date;
  reasoning: string;
  source: string;
}

export interface WebpageSource {
  id: string;
  url: string;
  title: string;
  lastScraped: Date;
  contentHash: string;
  relevanceScore: number;
}

export interface LearningSession {
  id: string;
  url: string;
  content: string;
  extractedInsights: string[];
  timestamp: Date;
  processingTime: number;
}

export interface BotMemory {
  totalPagesLearned: number;
  lastLearningSession: Date;
  knowledgeScore: number;
  topSources: WebpageSource[];
  recentInsights: string[];
}