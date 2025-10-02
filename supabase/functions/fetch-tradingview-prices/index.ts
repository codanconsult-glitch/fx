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
}

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

    console.log(`Fetching TradingView price for ${symbol}...`);

    const tradingViewUrl = `https://www.tradingview.com/symbols/${symbol}/`;
    
    const response = await fetch(tradingViewUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`TradingView fetch failed: ${response.status}`);
    }

    const html = await response.text();
    
    const priceData = extractPriceFromHTML(html, symbol);

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
    console.error("Error fetching TradingView price:", error);
    
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

function extractPriceFromHTML(html: string, symbol: string): PriceData {
  let price = 0;
  let change = 0;
  let changePercent = 0;
  
  try {
    const priceMatch = html.match(/"last":(\d+\.?\d*)/i) || 
                       html.match(/data-symbol-last["']?[^>]*>(\d+\.?\d*)</i) ||
                       html.match(/class="tv-symbol-price-quote__value["'][^>]*>(\d+\.?\d*)</i);
    
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }
    
    const changeMatch = html.match(/"change":([-+]?\d+\.?\d*)/i) ||
                        html.match(/data-symbol-change["']?[^>]*>([-+]?\d+\.?\d*)</i);
    
    if (changeMatch) {
      change = parseFloat(changeMatch[1]);
    }
    
    const changePercentMatch = html.match(/"change_percent":([-+]?\d+\.?\d*)/i) ||
                               html.match(/data-symbol-change-pt["']?[^>]*>([-+]?\d+\.?\d*)</i) ||
                               html.match(/([-+]?\d+\.?\d*)%/i);
    
    if (changePercentMatch) {
      changePercent = parseFloat(changePercentMatch[1]);
    }
    
    const highMatch = html.match(/"high":(\d+\.?\d*)/i);
    const lowMatch = html.match(/"low":(\d+\.?\d*)/i);
    
    const result: PriceData = {
      symbol,
      price,
      change,
      changePercent,
      timestamp: new Date().toISOString(),
    };
    
    if (highMatch) {
      result.high24h = parseFloat(highMatch[1]);
    }
    
    if (lowMatch) {
      result.low24h = parseFloat(lowMatch[1]);
    }
    
    console.log(`Extracted price for ${symbol}: ${price}`);
    
    return result;
  } catch (error) {
    console.error("Error parsing HTML:", error);
    throw new Error("Failed to parse price data");
  }
}
