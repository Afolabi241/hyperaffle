// The full catalog of stocks a coin can be paired with on the pad.
// Each deployed coin references one of these by symbol.

export type Stock = {
  symbol: string
  name: string
  sector: string
  color: string
}

export const STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Tech', color: '#a2aaad' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Semis', color: '#76b900' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Auto', color: '#e82127' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Tech', color: '#00a4ef' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Retail', color: '#ff9900' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Tech', color: '#ea4335' },
  { symbol: 'META', name: 'Meta', sector: 'Social', color: '#0866ff' },
  { symbol: 'AMD', name: 'AMD', sector: 'Semis', color: '#ed1c24' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Media', color: '#e50914' },
  { symbol: 'COIN', name: 'Coinbase', sector: 'Fintech', color: '#0052ff' },
  { symbol: 'HOOD', name: 'Robinhood', sector: 'Fintech', color: '#00c805' },
  { symbol: 'PLTR', name: 'Palantir', sector: 'Software', color: '#101113' },
  { symbol: 'MSTR', name: 'MicroStrategy', sector: 'Software', color: '#f5a623' },
  { symbol: 'GME', name: 'GameStop', sector: 'Retail', color: '#e4002b' },
  { symbol: 'AMC', name: 'AMC', sector: 'Media', color: '#f0141e' },
  { symbol: 'SPY', name: 'S&P 500', sector: 'Index', color: '#1e88e5' },
  { symbol: 'QQQ', name: 'Nasdaq 100', sector: 'Index', color: '#8e24aa' },
  { symbol: 'DIS', name: 'Disney', sector: 'Media', color: '#113ccf' },
  { symbol: 'BA', name: 'Boeing', sector: 'Aero', color: '#0033a0' },
  { symbol: 'JPM', name: 'JPMorgan', sector: 'Banks', color: '#5c2d2d' },
  { symbol: 'V', name: 'Visa', sector: 'Fintech', color: '#1a1f71' },
  { symbol: 'MA', name: 'Mastercard', sector: 'Fintech', color: '#eb001b' },
  { symbol: 'PYPL', name: 'PayPal', sector: 'Fintech', color: '#003087' },
  { symbol: 'SHOP', name: 'Shopify', sector: 'Ecom', color: '#95bf47' },
  { symbol: 'UBER', name: 'Uber', sector: 'Mobility', color: '#000000' },
  { symbol: 'ABNB', name: 'Airbnb', sector: 'Travel', color: '#ff5a5f' },
  { symbol: 'SOFI', name: 'SoFi', sector: 'Fintech', color: '#00b0f0' },
  { symbol: 'INTC', name: 'Intel', sector: 'Semis', color: '#0071c5' },
  { symbol: 'MU', name: 'Micron', sector: 'Semis', color: '#0e4d92' },
  { symbol: 'SMCI', name: 'Super Micro', sector: 'Hardware', color: '#00843d' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Semis', color: '#cc092f' },
  { symbol: 'CRM', name: 'Salesforce', sector: 'Software', color: '#00a1e0' },
  { symbol: 'ORCL', name: 'Oracle', sector: 'Software', color: '#f80000' },
  { symbol: 'BABA', name: 'Alibaba', sector: 'Ecom', color: '#ff6a00' },
  { symbol: 'NKE', name: 'Nike', sector: 'Retail', color: '#111111' },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer', color: '#f40009' },
]

const BY_SYMBOL = new Map(STOCKS.map((s) => [s.symbol, s]))

export function getStock(symbol: string): Stock | undefined {
  return BY_SYMBOL.get(symbol)
}

// Deterministic reference quote for the ticker strip. This is a display-only
// reference to the paired equity, not a live market feed.
export function refQuote(symbol: string): { price: number; change: number } {
  let h = 0
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0
  const price = 20 + (h % 900) + ((h >> 8) % 100) / 100
  const change = (((h >> 4) % 1400) - 600) / 100 / 100 // -6%..+8%
  return { price, change }
}
