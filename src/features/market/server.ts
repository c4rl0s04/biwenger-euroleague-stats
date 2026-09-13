import 'server-only';
export {
  getMarketTrendsAnalysis,
  MARKET_TRENDS_POLICY,
} from './server/services/market-trends.service';
export { parseMarketTrendDays } from './validation/market-trends';
