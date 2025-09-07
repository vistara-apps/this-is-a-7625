# MemeSwap Aggregator

**One-click cross-chain meme coin trades, simplified.**

A comprehensive web application for crypto users to aggregate their meme coin portfolios across multiple blockchains and execute cross-chain swaps seamlessly.

![MemeSwap Dashboard](https://via.placeholder.com/800x400/1e1b4b/ffffff?text=MemeSwap+Dashboard)

## 🚀 Features

### ✅ Implemented Core Features

- **🔗 Unified Portfolio Dashboard**: Track all meme coin holdings across Ethereum, BSC, Solana, Arbitrum, Base, and Polygon in a single view
- **⚡ Cross-Chain Swap Interface**: Execute token swaps between different blockchain networks with one-click simplicity
- **📈 Real-Time Trend Monitoring**: Discover trending meme coins with AI-powered sentiment analysis
- **🛡️ Slippage & Bot Protection**: Advanced trade execution with MEV protection and slippage control
- **💳 Wallet Integration**: Seamless connection with MetaMask, WalletConnect, and other popular wallets
- **📊 Portfolio Analytics**: Comprehensive statistics and performance tracking
- **🎨 Modern UI/UX**: Glass-morphism design with responsive layout and dark theme

### 🔧 Technical Implementation

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Blockchain Integration**: Wagmi + RainbowKit + Viem
- **API Services**: Bitquery, Alchemy, OpenAI, Supabase
- **Cross-Chain**: 1inch, LiFi, ParaSwap integration
- **State Management**: React Hooks + Context API
- **Styling**: Tailwind CSS with custom design system

## 🏗️ Architecture

```
src/
├── components/          # React components
│   ├── AppShell.jsx    # Main layout and navigation
│   ├── PortfolioDashboard.jsx  # Portfolio overview
│   ├── SwapInterface.jsx       # Cross-chain swap UI
│   ├── TrendMonitor.jsx        # Trending coins display
│   ├── TokenDisplay.jsx        # Token information cards
│   ├── TrendCard.jsx          # Individual trend cards
│   └── Card.jsx               # Reusable card component
├── services/           # API and business logic
│   ├── api.js         # API client configuration
│   ├── portfolioService.js    # Portfolio data aggregation
│   ├── trendService.js        # Trend analysis and sentiment
│   ├── swapService.js         # Cross-chain swap logic
│   └── databaseService.js     # Supabase data persistence
├── hooks/             # Custom React hooks
│   └── usePaymentContext.js   # Payment processing
└── styles/           # CSS and styling
    └── index.css     # Global styles and design tokens
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Git
- API keys for external services (see below)

### 1. Clone and Install

```bash
git clone https://github.com/vistara-apps/this-is-a-7625.git
cd this-is-a-7625
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your API credentials:

```env
# Required API Keys
VITE_BITQUERY_API_KEY=your_bitquery_api_key
VITE_ALCHEMY_API_KEY=your_alchemy_api_key  
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
```

### 3. Database Setup (Supabase)

Create the following tables in your Supabase project:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR UNIQUE NOT NULL,
  eth_address VARCHAR UNIQUE NOT NULL,
  connected_wallets JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portfolio table
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR REFERENCES users(user_id),
  token_address VARCHAR NOT NULL,
  chain VARCHAR NOT NULL,
  quantity DECIMAL NOT NULL,
  purchase_price DECIMAL,
  current_price DECIMAL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swap transactions table
CREATE TABLE swap_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  swap_id VARCHAR UNIQUE NOT NULL,
  user_id VARCHAR REFERENCES users(user_id),
  from_token VARCHAR NOT NULL,
  from_chain VARCHAR NOT NULL,
  to_token VARCHAR NOT NULL,
  to_chain VARCHAR NOT NULL,
  amount DECIMAL NOT NULL,
  fee DECIMAL,
  transaction_hash VARCHAR,
  status VARCHAR DEFAULT 'pending',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meme coin trends table
CREATE TABLE meme_coin_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trend_id VARCHAR UNIQUE NOT NULL,
  token_address VARCHAR NOT NULL,
  chain VARCHAR NOT NULL,
  sentiment_score INTEGER,
  volume DECIMAL,
  price_change_24h DECIMAL,
  market_cap DECIMAL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

### 5. Build for Production

```bash
npm run build
npm run preview
```

## 📡 API Documentation

### Portfolio Service

**Fetch Aggregated Portfolio**
```javascript
import { fetchAggregatedPortfolio } from './services/portfolioService';

const portfolio = await fetchAggregatedPortfolio(walletAddress);
// Returns: Array of token holdings across all chains
```

**Calculate Portfolio Statistics**
```javascript
import { calculatePortfolioStats } from './services/portfolioService';

const stats = calculatePortfolioStats(portfolioData);
// Returns: { totalValue, totalChange24h, tokenCount, chainCount }
```

### Trend Service

**Get Comprehensive Trend Data**
```javascript
import { getComprehensiveTrendData } from './services/trendService';

const trends = await getComprehensiveTrendData('ethereum', 20);
// Returns: Array of trending tokens with sentiment analysis
```

**Analyze Sentiment**
```javascript
import { analyzeSentiment } from './services/trendService';

const sentiment = await analyzeSentiment('PEPE', 'Pepe');
// Returns: { sentiment, sentimentScore, factors, explanation }
```

### Swap Service

**Get Swap Quote**
```javascript
import { getSwapQuote } from './services/swapService';

const quote = await getSwapQuote({
  fromTokenAddress: '0x...',
  toTokenAddress: '0x...',
  amount: '1000000',
  fromChainId: 1,
  toChainId: 56,
  userAddress: '0x...'
});
// Returns: Quote with pricing, fees, and execution details
```

**Execute Swap**
```javascript
import { executeSwap } from './services/swapService';

const result = await executeSwap(quoteData, userAddress, signer);
// Returns: Transaction hash and status
```

## 🔗 External API Integration

### Bitquery API
- **Purpose**: On-chain data and trading analytics
- **Endpoint**: `https://graphql.bitquery.io`
- **Documentation**: [Bitquery Docs](https://docs.bitquery.io/)

### Alchemy API  
- **Purpose**: Blockchain node access and token data
- **Endpoint**: `https://eth-mainnet.g.alchemy.com/v2/`
- **Documentation**: [Alchemy Docs](https://docs.alchemy.com/)

### OpenAI API
- **Purpose**: Sentiment analysis and trend insights
- **Endpoint**: `https://api.openai.com/v1`
- **Documentation**: [OpenAI Docs](https://platform.openai.com/docs)

### Supabase
- **Purpose**: Backend database and user management
- **Documentation**: [Supabase Docs](https://supabase.com/docs)

## 🎨 Design System

### Color Palette
```css
:root {
  --bg: 210 30% 8%;
  --surface: 210 20% 12%;
  --primary: 210 70% 50%;
  --accent: 130 70% 50%;
  --text-primary: 210 20% 90%;
  --text-secondary: 210 20% 70%;
}
```

### Typography
- **Display**: text-4xl font-bold
- **Heading**: text-2xl font-semibold  
- **Body**: text-base font-normal leading-7
- **Caption**: text-sm font-medium

### Components
- **Glass Cards**: `backdrop-filter: blur(10px)` with transparency
- **Gradient Text**: Purple to blue gradient for branding
- **Responsive Grid**: 12-column fluid layout
- **Motion**: Smooth transitions with cubic-bezier easing

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Docker
```bash
docker build -t memeswap-aggregator .
docker run -p 3000:3000 memeswap-aggregator
```

## 🔒 Security Considerations

- **API Keys**: Never expose API keys in client-side code
- **Wallet Security**: Use secure wallet connection practices
- **Input Validation**: Validate all user inputs and transaction parameters
- **Rate Limiting**: Implement rate limiting for API calls
- **HTTPS**: Always use HTTPS in production
- **CSP**: Configure Content Security Policy headers

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests  
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📈 Performance Optimization

- **Code Splitting**: Lazy load components and routes
- **API Caching**: Cache API responses with appropriate TTL
- **Image Optimization**: Use WebP format and lazy loading
- **Bundle Analysis**: Monitor bundle size with `npm run analyze`
- **CDN**: Serve static assets from CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact support@memeswap.app

## 🗺️ Roadmap

### Phase 1 (Current) ✅
- [x] Portfolio aggregation across major chains
- [x] Basic cross-chain swap functionality  
- [x] Trend monitoring with sentiment analysis
- [x] Wallet integration and user management

### Phase 2 (Next)
- [ ] Advanced trading features (limit orders, DCA)
- [ ] Mobile app development
- [ ] Additional chain support (Avalanche, Fantom)
- [ ] Social trading features
- [ ] Advanced analytics dashboard

### Phase 3 (Future)
- [ ] Yield farming integration
- [ ] NFT portfolio tracking
- [ ] Advanced MEV protection
- [ ] Institutional features
- [ ] API for third-party developers

---

**Built with ❤️ for the meme coin community**

*MemeSwap Aggregator - Making cross-chain meme coin trading accessible to everyone.*
