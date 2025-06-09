# 🌐 URL Health Monitor

A modern,  website monitoring solution built with Next.js 14, TypeScript, and Docker. Monitor website status, track response times, and analyze historical uptime metrics through an intuitive dashboard.


## ✨ Features

- 🚀 **Real-time Monitoring** - Instant UP/DOWN status for all monitored URLs
- 📊 **Performance Metrics** - Track response times and uptime percentages
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔄 **Auto-refresh** - Continuously monitor URLs at regular intervals
- 📝 **Bulk Operations** - Add multiple URLs at once with bulk import
- 📈 **Historical Analytics** - View trends and patterns over time
- 💾 **Local Storage** - Data persists between sessions
- 🐳 **Docker Support** - Easy deployment with Docker and Docker Compose

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Containerization**: [Docker](https://www.docker.com/)
- **Runtime**: [Node.js](https://nodejs.org/) 18+

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Docker (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/AbhinayreddyPochampally/url-health-monitor.git
   cd url-health-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000) to see the application in action.

### Docker Deployment

#### Using Docker Compose (Recommended)

```bash
docker-compose up --build -d
```

#### Manual Docker Build

```bash
# Build the Docker image
docker build -t url-monitor .

# Run the container
docker run -p 3000:3000 --name url-monitor-container url-monitor
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 📋 Usage

1. **Adding URLs**
   - Click the "+" button to add a single URL
   - Use the bulk import feature to add multiple URLs at once (one per line)
   - New URLs are automatically checked and added to the top of the list

2. **Monitoring**
   - Green status indicates the URL is UP
   - Red status indicates the URL is DOWN
   - Response time is displayed in milliseconds
   - Last checked timestamp shows when the URL was last verified

3. **Detailed View**
   - Click on any URL to expand its detailed view
   - View historical response time graph
   - See uptime percentage and status history

4. **Bulk Actions**
   - Use the "Check All" button to verify all URLs at once
   - Remove individual URLs or clear all at once

## 🏗 Project Structure

```
url-health-monitor/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   └── check-url/      # URL health check endpoint
│   ├── favicon.ico         # Favicon
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main page component
├── components/             # Reusable components
│   ├── ui/                 # shadcn/ui components
│   └── url-metrics.tsx     # URL metrics component
├── public/                 # Static files
├── .dockerignore           # Docker ignore file
├── .eslintrc.json         # ESLint configuration
├── .gitignore             # Git ignore file
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── next.config.mjs        # Next.js configuration
├── package.json           # Project dependencies
├── postcss.config.mjs     # PostCSS configuration
├── README.md             # This file
└── tailwind.config.ts    # Tailwind CSS configuration
```

## 🔧 Configuration

Environment variables can be configured in the `.env.local` file:

```env
# Next.js configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development

# Application settings
CHECK_INTERVAL=300000  # 5 minutes in milliseconds
MAX_HISTORY_ENTRIES=1000
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---
