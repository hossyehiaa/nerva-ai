# Nerva AI — When Your Business Thinks for Itself

A professional website for Nerva AI, a B2B AI SaaS Platform & Full-Stack Automation Agency.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + Custom dark tech theme
- **UI Components:** shadcn/ui + Lucide Icons
- **Animations:** Framer Motion
- **Deployment:** Vercel / Render ready

## Features

- 🤖 AI-powered business automation showcase
- 💬 7 service offerings with detailed descriptions
- 💰 Transparent pricing with monthly/annual toggle
- ❓ Interactive FAQ section
- 📱 Fully responsive design (mobile-first)
- 🌙 Dark tech/SaaS theme with glassmorphism
- ✨ Smooth animations and transitions
- 🔗 SEO optimized with Open Graph meta tags

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Deployment

### Vercel (Recommended)

1. Push this repository to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Vercel auto-detects Next.js — no configuration needed
4. Deploy!

### Render

1. Push this repository to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Set Build Command: `bun run build`
4. Set Start Command: `bun run start`
5. Deploy!

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with metadata & fonts
│   ├── page.tsx            # Main page assembling all sections
│   └── globals.css         # Global styles & dark theme
├── components/
│   └── sections/
│       ├── Navbar.tsx      # Fixed navigation with mobile menu
│       ├── Hero.tsx        # Hero section with CTA & stats
│       ├── WhyNerva.tsx    # Benefits/value proposition
│       ├── Services.tsx    # 7 services showcase
│       ├── HowItWorks.tsx  # 3-step process
│       ├── Pricing.tsx     # Pricing plans & toggle
│       ├── FAQ.tsx         # Interactive accordion FAQ
│       ├── CTA.tsx         # Call to action with email form
│       └── Footer.tsx      # Footer with links & social
└── lib/
    └── utils.ts            # Utility functions
```

## License

© 2025 Nerva AI. All rights reserved.
