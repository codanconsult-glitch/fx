interface MarketPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  source: 'TRADINGVIEW' | 'SIMULATED';
}

interface PriceHistory {
  timestamp: Date;
  price: number;
  volume: number;
}

export class MarketPriceService {
  private static priceCache: Map<string, MarketPrice> = new Map();
  private static priceHistory: Map<string, PriceHistory[]> = new Map();
  private static updateInterval: NodeJS.Timeout | null = null;
  private static lastTradingViewUpdate: Map<string, number> = new Map();

  // Fallback prices if TradingView extraction fails
  private static readonly FALLBACK_PRICES = {
    'XAUUSD': 2650.00,
    'EURUSD': 1.0550,
    'GBPUSD': 1.2650,
    'USDJPY': 149.50,
    'AUDUSD': 0.6750,
    'USDCAD': 1.3550
  };

  static initialize() {
    // Initialize prices
    Object.keys(this.FALLBACK_PRICES).forEach(symbol => {
      this.updatePrice(symbol);
    });

    // Start real-time price updates every 30 seconds (to avoid rate limiting TradingView)
    this.updateInterval = setInterval(() => {
      Object.keys(this.FALLBACK_PRICES).forEach(symbol => {
        this.updatePrice(symbol);
      });
    }, 30000);

    console.log('📊 Market Price Service initialized with TradingView price extraction');
  }

  private static async updatePrice(symbol: string) {
    const fallbackPrice = this.FALLBACK_PRICES[symbol as keyof typeof this.FALLBACK_PRICES];
    const currentPrice = this.priceCache.get(symbol)?.price || basePrice;
    
    // Try to get real price from TradingView (with rate limiting)
    let realPrice: number | null = null;
    const lastUpdate = this.lastTradingViewUpdate.get(symbol) || 0;
    const now = Date.now();
    
    // Only fetch from TradingView every 2 minutes per symbol to avoid rate limiting
    if (now - lastUpdate > 120000) {
      try {
        console.log(`🔄 Fetching real price for ${symbol} from TradingView...`);
        const sentiment = await TradingViewExtractor.extractTradingViewSentiment(symbol);
        if (sentiment?.currentPrice) {
          realPrice = sentiment.currentPrice;
          this.lastTradingViewUpdate.set(symbol, now);
          console.log(`✅ Real price for ${symbol}: ${realPrice}`);
        }
      } catch (error) {
        console.warn(`Failed to get real price for ${symbol}, using simulation:`, error);
      }
    }
    
    // Use real price if available, otherwise simulate realistic movement
    let newPrice: number;
    let source: 'TRADINGVIEW' | 'SIMULATED';
    
    if (realPrice) {
      newPrice = realPrice;
      source = 'TRADINGVIEW';
    } else {
      // Simulate realistic price movement
      const volatility = this.getVolatility(symbol);
      const trend = this.getTrendBias(symbol);
      const randomMovement = (Math.random() - 0.5) * 2;
      const trendMovement = trend * 0.3;
      
      const priceChange = (randomMovement + trendMovement) * volatility * currentPrice;
      newPrice = Math.max(0, currentPrice + priceChange);
      source = 'SIMULATED';
    }
    
    // Calculate spread (bid/ask)
    const spread = this.getSpread(symbol);
    const bid = newPrice - spread / 2;
    const ask = newPrice + spread / 2;
    
    // Get previous price for change calculation
    const previousPrice = this.priceCache.get(symbol)?.price || fallbackPrice;
    const change = newPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    // Update 24h high/low
    const existing = this.priceCache.get(symbol);
    const high24h = existing ? Math.max(existing.high24h, newPrice) : newPrice;
    const low24h = existing ? Math.min(existing.low24h, newPrice) : newPrice;
    
    const marketPrice: MarketPrice = {
      symbol,
      price: Number(newPrice.toFixed(this.getDecimals(symbol))),
      change: Number(change.toFixed(this.getDecimals(symbol))),
      changePercent: Number(changePercent.toFixed(2)),
      timestamp: new Date(),
      bid: Number(bid.toFixed(this.getDecimals(symbol))),
      ask: Number(ask.toFixed(this.getDecimals(symbol))),
      high24h: Number(high24h.toFixed(this.getDecimals(symbol))),
      low24h: Number(low24h.toFixed(this.getDecimals(symbol))),
      source
    };
    
    this.priceCache.set(symbol, marketPrice);
    
    // Store price history
    this.addPriceHistory(symbol, newPrice);
    
    if (source === 'TRADINGVIEW') {
      console.log(`📊 Updated ${symbol} with real TradingView price: ${newPrice}`);
    }
  }

  private static getVolatility(symbol: string): number {
    switch (symbol) {
      case 'XAUUSD': return 0.008; // 0.8% volatility for gold
      case 'EURUSD': return 0.003; // 0.3% volatility for EUR/USD
      case 'GBPUSD': return 0.004; // 0.4% volatility for GBP/USD
      case 'USDJPY': return 0.003; // 0.3% volatility for USD/JPY
      case 'AUDUSD': return 0.005; // 0.5% volatility for AUD/USD
      case 'USDCAD': return 0.003; // 0.3% volatility for USD/CAD
      default: return 0.005;
    }
  }

  private static getTrendBias(symbol: string): number {
    // Simulate market trends (-1 bearish, 0 neutral, 1 bullish)
    const trends = {
      'XAUUSD': 0.2,   // Slightly bullish gold
      'EURUSD': -0.1,  // Slightly bearish EUR/USD
      'GBPUSD': 0.1,   // Slightly bullish GBP/USD
      'USDJPY': 0.3,   // Bullish USD/JPY
      'AUDUSD': -0.2,  // Bearish AUD/USD
      'USDCAD': 0.1    // Slightly bullish USD/CAD
    };
    
    return trends[symbol as keyof typeof trends] || 0;
  }

  private static getSpread(symbol: string): number {
    switch (symbol) {
      case 'XAUUSD': return 0.50;   // $0.50 spread for gold
      case 'EURUSD': return 0.0001; // 1 pip spread
      case 'GBPUSD': return 0.0002; // 2 pip spread
      case 'USDJPY': return 0.002;  // 2 pip spread
      case 'AUDUSD': return 0.0002; // 2 pip spread
      case 'USDCAD': return 0.0002; // 2 pip spread
      default: return 0.0001;
    }
  }

  private static getDecimals(symbol: string): number {
    switch (symbol) {
      case 'XAUUSD': return 2;  // 2 decimal places for gold
      case 'USDJPY': return 3;  // 3 decimal places for JPY pairs
      default: return 4;        // 4 decimal places for major pairs
    }
  }

  private static addPriceHistory(symbol: string, price: number) {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, []);
    }
    
    const history = this.priceHistory.get(symbol)!;
    history.push({
      timestamp: new Date(),
      price,
      volume: Math.floor(Math.random() * 100000) + 10000
    });
    
    // Keep only last 1000 price points
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  static getCurrentPrice(symbol: string): MarketPrice | null {
    return this.priceCache.get(symbol) || null;
  }
  
  static async getRealTimePrice(symbol: string): Promise<number | null> {
    try {
      const realPrice = await TradingViewExtractor.getCurrentPrice(symbol);
      if (realPrice) {
        console.log(`📊 Real-time price for ${symbol}: ${realPrice}`);
        return realPrice;
      }
    } catch (error) {
      console.warn(`Failed to get real-time price for ${symbol}:`, error);
    }
    
    // Fallback to cached price
    const cached = this.getCurrentPrice(symbol);
    return cached?.price || null;
  }

  static getAllPrices(): Map<string, MarketPrice> {
    return new Map(this.priceCache);
  }

  static getPriceHistory(symbol: string, limit: number = 100): PriceHistory[] {
    const history = this.priceHistory.get(symbol) || [];
    return history.slice(-limit);
  }

  static isMarketOpen(): boolean {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    
    // Forex market is closed on weekends
    if (day === 0 || day === 6) return false;
    
    // Market is generally open 24/5
    return true;
  }

  static getMarketStatus(): 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS' {
    if (!this.isMarketOpen()) return 'CLOSED';
    
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Major trading sessions
    if ((hour >= 0 && hour < 7) || (hour >= 13 && hour < 22)) {
      return 'OPEN'; // Major sessions active
    }
    
    return 'AFTER_HOURS';
  }

  static cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Method to check if TP/SL levels are hit
  static checkTPSLLevels(signal: any): {
    tp1Hit: boolean;
    tp2Hit: boolean;
    tp3Hit: boolean;
    stopLossHit: boolean;
    currentPrice: number;
    priceSource: 'TRADINGVIEW' | 'SIMULATED';
  } {
    const currentPrice = this.getCurrentPrice(signal.symbol);
    if (!currentPrice) {
      return {
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        stopLossHit: false,
        currentPrice: signal.entryPrice,
        priceSource: 'SIMULATED'
      };
    }

    const price = currentPrice.price;
    
    if (signal.signal === 'BUY') {
      return {
        tp1Hit: price >= signal.takeProfit1,
        tp2Hit: price >= signal.takeProfit2,
        tp3Hit: price >= signal.takeProfit3,
        stopLossHit: price <= signal.stopLoss,
        currentPrice: price,
        priceSource: currentPrice.source
      };
    } else {
      return {
        tp1Hit: price <= signal.takeProfit1,
        tp2Hit: price <= signal.takeProfit2,
        tp3Hit: price <= signal.takeProfit3,
        stopLossHit: price >= signal.stopLoss,
        currentPrice: price,
        priceSource: currentPrice.source
      };
    }
  }
import { TradingViewExtractor } from './tradingViewExtractor';
}