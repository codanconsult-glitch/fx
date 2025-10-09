interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  timestamp: string;
  source: string;
}

export class InvestingPriceService {
  private static cache = new Map<string, { data: PriceData; timestamp: number }>();
  private static CACHE_DURATION = 10000; // 10 seconds

  static async getRealTimePrice(symbol: string): Promise<number> {
    try {
      const priceData = await this.getPriceData(symbol);
      return priceData.price;
    } catch (error) {
      console.error(`Error getting real-time price for ${symbol}:`, error);
      return this.getFallbackPrice(symbol);
    }
  }

  static async getPriceData(symbol: string): Promise<PriceData> {
    const cached = this.cache.get(symbol);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      console.log(`Using cached price for ${symbol}: $${cached.data.price}`);
      return cached.data;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/fetch-investing-prices?symbol=${symbol}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PriceData = await response.json();

      this.cache.set(symbol, { data, timestamp: now });

      console.log(`✅ Investing.com ${symbol}: $${data.price} (${data.changePercent > 0 ? '+' : ''}${data.changePercent}%)`);

      return data;
    } catch (error) {
      console.error(`Error fetching Investing.com price for ${symbol}:`, error);

      const fallbackData: PriceData = {
        symbol,
        price: this.getFallbackPrice(symbol),
        change: 0,
        changePercent: 0,
        high: 0,
        low: 0,
        open: 0,
        prevClose: 0,
        timestamp: new Date().toISOString(),
        source: 'Fallback'
      };

      return fallbackData;
    }
  }

  static async getAllPrices(): Promise<{ [key: string]: PriceData }> {
    const symbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY'];
    const prices: { [key: string]: PriceData } = {};

    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          prices[symbol] = await this.getPriceData(symbol);
          await this.delay(1000);
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error);
        }
      })
    );

    return prices;
  }

  private static getFallbackPrice(symbol: string): number {
    const fallbackPrices: { [key: string]: number } = {
      'XAUUSD': 2650.00,
      'EURUSD': 1.0850,
      'GBPUSD': 1.2680,
      'USDJPY': 149.50,
      'AUDUSD': 0.6420,
      'USDCAD': 1.3950,
    };

    return fallbackPrices[symbol] || 1.0;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static clearCache(): void {
    this.cache.clear();
    console.log('Price cache cleared');
  }
}
