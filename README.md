# 🏀 BiwengerStats - Next.js Version

> Modern React dashboard for BiwengerLeague statistics - Built with Next.js 15

This is the **Next.js migration** of the original Flask-based BiwengerStats dashboard. This version uses React for the frontend and Next.js API routes for the backend, while maintaining the same SQLite database.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- The SQLite database from the Flask version (`data/biwenger.db`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## 📂 Project Structure

```
biwengerstats-next/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.js          # Root layout with navigation
│   │   ├── page.js            # Home page
│   │   ├── market/            # Market analysis page
│   │   ├── porras/            # Porras statistics page
│   │   ├── usuarios/          # Squad analysis page
│   │   └── api/               # API routes (backend)
│   ├── components/            # Reusable React components
│   └── lib/                   # Utilities
│       └── database.js        # SQLite database access
├── data/                      # SQLite database
│   └── biwenger.db           # Copied from Flask project
└── public/                    # Static assets
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + Tailwind CSS
- **Database**: SQLite (better-sqlite3)
- **Charts**: Chart.js + react-chartjs-2
- **Deployment**: Vercel (recommended)

## 📊 Features

### ✅ Implemented

- [x] Home dashboard with quick stats
- [x] Navigation layout
- [x] Database connection
- [x] Server-side data fetching

### 🚧 In Progress (Migration from Flask)

- [ ] Market page with charts
- [ ] Porras statistics page
- [ ] Usuarios/Squad analysis page
- [ ] Analytics page

## 🔄 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📚 Learning Resources

This project is part of learning React/Next.js. Key concepts demonstrated:

- **Server Components**: Data fetching on the server
- **Client Components**: Interactive UI elements
- **App Router**: File-based routing
- **API Routes**: Backend endpoints
- **Tailwind CSS**: Utility-first styling

## 🔗 Related Projects

- **Flask Version**: `../SimpleBiwenger` - Original Python/Flask dashboard
- **Scraper**: Uses the same database created by the Python scraper

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

### Environment Variables

No environment variables needed - database is included in the repo (local use only).

## 📝 Notes

- This project uses the **same SQLite database** as the Flask version
- Data is scraped by the Python project and read by this Next.js app
- Both projects can run simultaneously on different ports

## 👤 Author

**Carlos Andrés Huete**

- GitHub: [@c4rl0s04](https://github.com/c4rl0s04)

---

Made with ❤️ while learning React and Next.js
