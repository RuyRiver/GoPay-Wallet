export interface TokenPrice {
  symbol: string;
  price: number; // Price in USD
  change24h: number; // Percentage change in 24h
  lastUpdated: number; // Timestamp
}

/**
 * Price Service for Stacks using CoinGecko API
 * Fetches live prices for STX, sBTC, USDA tokens
 */
class PriceService {
  private static readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';
  private static readonly CACHE_DURATION = 60 * 1000; // 1 minute cache

  // Map Stacks symbols to CoinGecko IDs
  private static readonly COINGECKO_IDS: Record<string, string> = {
    'STX': 'blockstack',
    'sBTC': 'bitcoin',  // Using BTC as proxy since sBTC tracks BTC
    'USDA': 'usd',      // Using USD as proxy
    'ALEX': 'alex',
    'DIKO': 'arkadiko'
  };

  // Price cache to reduce API calls
  private static priceCache: Map<string, { data: TokenPrice; timestamp: number }> = new Map();

  /**
   * Get price for a specific token from CoinGecko
   */
  static async getTokenPrice(symbol: string): Promise<TokenPrice | null> {
    try {
      const upperSymbol = symbol.toUpperCase();
      const coingeckoId = this.COINGECKO_IDS[upperSymbol];

      if (!coingeckoId) {
        console.warn(`[PriceService] No CoinGecko ID mapping for ${symbol}`);
        return null;
      }

      // Check cache first
      const cached = this.priceCache.get(upperSymbol);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log(`[PriceService] Using cached price for ${symbol}`);
        return cached.data;
      }

      // Fetch from CoinGecko API
      console.log(`[PriceService] Fetching live price for ${symbol} from CoinGecko...`);
      const url = `${this.COINGECKO_API}/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error(`[PriceService] CoinGecko API error: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data[coingeckoId]) {
        console.error(`[PriceService] No price data for ${coingeckoId}`);
        return null;
      }

      const tokenData = data[coingeckoId];
      const tokenPrice: TokenPrice = {
        symbol: upperSymbol,
        price: tokenData.usd || 0,
        change24h: tokenData.usd_24h_change || 0,
        lastUpdated: Date.now(),
      };

      // Cache the result
      this.priceCache.set(upperSymbol, {
        data: tokenPrice,
        timestamp: Date.now(),
      });

      console.log(`[PriceService] ${symbol} price: $${tokenPrice.price} (${tokenPrice.change24h > 0 ? '+' : ''}${tokenPrice.change24h.toFixed(2)}%)`);

      return tokenPrice;
    } catch (error) {
      console.error(`[PriceService] Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Get prices for multiple tokens at once
   */
  static async getTokenPrices(symbols: string[]): Promise<TokenPrice[]> {
    const pricePromises = symbols.map(symbol => this.getTokenPrice(symbol));
    const prices = await Promise.all(pricePromises);
    return prices.filter(price => price !== null) as TokenPrice[];
  }

  /**
   * Clear price cache (useful for manual refresh)
   */
  static clearCache(): void {
    this.priceCache.clear();
    console.log('[PriceService] Price cache cleared');
  }
}

export default PriceService;
