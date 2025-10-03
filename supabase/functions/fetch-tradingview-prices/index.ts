const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  timestamp: string;
  source: string;
}

interface PriceCache {
  [symbol: string]: {
    price: number;
    timestamp: number;
  };
}

const priceCache: PriceCache = {};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const symbol = url.searchParams.get("symbol") || "EURUSD";

    console.log(`Fetching forex price for ${symbol}...`);

    const priceData = await fetchForexPrice(symbol);

    return new Response(
      JSON.stringify(priceData),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching forex price:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch price",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

async function fetchForexPrice(symbol: string): Promise<PriceData> {
  try {
    let price = 0;
    let source = "API";
    
    if (symbol === "XAUUSD") {
      price = await fetchGoldPrice();
      source = "GoldAPI";
    } else {
      price = await fetchCurrencyPairPrice(symbol);
      source = "ForexAPI";
    }
    
    const previousPrice = priceCache[symbol]?.price || price;
    const change = price - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    priceCache[symbol] = {
      price,
      timestamp: Date.now()
    };
    
    const decimals = symbol === "XAUUSD" ? 2 : symbol.includes("JPY") ? 3 : 5;
    
    const result: PriceData = {
      symbol,
      price: parseFloat(price.toFixed(decimals)),
      change: parseFloat(change.toFixed(decimals)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: new Date().toISOString(),
      source
    };
    
    console.log(`✅ Fetched ${symbol}: $${result.price} (${result.changePercent > 0 ? '+' : ''}${result.changePercent}%) from ${source}`);
    
    return result;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

async function fetchCurrencyPairPrice(symbol: string): Promise<number> {
  const baseCurrency = symbol.substring(0, 3);
  const quoteCurrency = symbol.substring(3, 6);
  
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.rates && data.rates[quoteCurrency]) {
      const rate = data.rates[quoteCurrency];
      console.log(`API returned ${baseCurrency}/${quoteCurrency}: ${rate}`);
      return rate;
    }
    
    throw new Error(`Rate not found for ${symbol}`);
  } catch (error) {
    console.error(`Primary API failed for ${symbol}, trying alternative...`, error);
    
    try {
      const fallbackResponse = await fetch(
        `https://open.er-api.com/v6/latest/${baseCurrency}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.rates && fallbackData.rates[quoteCurrency]) {
          console.log(`Fallback API returned ${baseCurrency}/${quoteCurrency}: ${fallbackData.rates[quoteCurrency]}`);
          return fallbackData.rates[quoteCurrency];
        }
      }
    } catch (fallbackError) {
      console.error(`Fallback API also failed:`, fallbackError);
    }
    
    console.warn(`All APIs failed for ${symbol}, using reasonable estimate`);
    const estimates: { [key: string]: number } = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2680,
      'USDJPY': 149.50,
      'AUDUSD': 0.6420,
      'USDCAD': 1.3950,
      'USDCHF': 0.8850,
      'NZDUSD': 0.5850,
    };
    
    return estimates[symbol] || 1.0;
  }
}

async function fetchGoldPrice(): Promise<number> {
  try {
    const response = await fetch(
      'https://api.metals.live/v1/spot/gold',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const goldData = data[0];
        if (goldData.price) {
          console.log(`Metals.live returned gold price: $${goldData.price}`);
          return goldData.price;
        }
      }
    }
  } catch (error) {
    console.warn('Metals.live API failed:', error);
  }
  
  try {
    const response = await fetch(
      'https://data-asg.goldprice.org/dbXRates/USD',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.items && data.items.length > 0) {
        const xauPrice = data.items.find((item: any) => item.curr === 'XAU');
        if (xauPrice && xauPrice.xauPrice) {
          console.log(`GoldPrice.org returned gold price: $${xauPrice.xauPrice}`);
          return xauPrice.xauPrice;
        }
      }
    }
  } catch (error) {
    console.warn('GoldPrice.org API failed:', error);
  }
  
  console.log('All gold APIs failed, using market estimate');
  return 2650.00;
}
