# FreshMarket BD - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js 18+ (`node -v`)
- npm or yarn (`npm -v`)
- Git
- Supabase account (free tier sufficient)
- SMS credential (Twilio or SSLCommerz)

### 1️⃣ Clone & Install

```bash
cd /Users/wedevs/Desktop/Sites/farmer

# Install dependencies
npm install

# or
yarn install
```

### 2️⃣ Setup Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up → Create new project
3. Wait for project to initialize
4. Go to Settings → API

Copy these values:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

### 3️⃣ Create `.env.local`

```bash
# Copy this into .env.local

# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Service role (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# SMS Provider (use ONE)
# For Twilio:
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# OR for SSLCommerz:
SSLCOMMERZ_STORE_ID=test
SSLCOMMERZ_STORE_PASSWORD=test123
SSLCOMMERZ_API_URL=https://sandbox.sslcommerz.com

# Payment (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# Admin Email (for sensitive actions)
ADMIN_EMAIL=admin@freshmarket.local

# Port
PORT=3000
```

### 4️⃣ Setup Supabase Database

**Option A: Use Supabase CLI (Recommended)**

```bash
# Login to Supabase
npx supabase login

# Link project
npx supabase link --project-ref your_project_id

# Push migrations
npx supabase db push
```

**Option B: Manually Run SQL**

1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content from `db/01-schema.sql`
4. Run query
5. Repeat for `db/02-*.sql`, `db/03-*.sql`, etc. (3 total migration files)

### 5️⃣ Start Development Server

```bash
npm run dev
```

The app should open at `http://localhost:3000`

---

## 🧪 Try It Out

### Sign Up (30 seconds)

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Choose role:
   - **Customer** → Order products
   - **Seller** → Add products (need NID verification)
   - **Pickup Agent** → Collect orders
4. Complete sign up

### Place an Order (as Customer)

1. Dashboard → "Order Now"
2. Select village (e.g., "Kuratoli")
3. Add products to cart
4. Checkout (6 AM - 10 PM only for demo)
5. Order created! ✅

### Add Products (as Seller)

1. Dashboard → "Add Product"
2. Fill: Name, Description, Price, Stock
3. Upload image
4. Create product ✅
5. Products appear in customer search

### Admin Dashboard (as Admin)

1. Login as admin@freshmarket.local (password: test123)
2. Sidebar → "Admin" → See all options:
   - Orders (real-time updates)
   - Agents (GPS tracking)
   - Analytics (revenue charts)
   - Settings

### Translation (Switch Language)

1. Top-right → Language toggle
2. English ↔ Bangla (বাংলা)
3. All UI switches instantly ✅

---

## 📝 Project Structure

```
farmer/
├── app/
│   ├── (auth)/                  # Auth pages (signup, signin)
│   ├── (dashboard)/             # Protected dashboards
│   │   ├── customer/
│   │   ├── seller/
│   │   ├── agent/
│   │   └── admin/
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── cron/                # Automated jobs
│   │   └── webhooks/            # Stripe webhooks
│   └── layout.tsx               # Root layout (with PWA)
│
├── components/
│   ├── auth/                    # Auth components
│   ├── products/                # Product listing
│   ├── orders/                  # Order placement
│   ├── admin/                   # Admin dashboard
│   ├── pwa/                     # PWA components
│   └── i18n/                    # Language switcher
│
├── lib/
│   ├── supabase/                # DB client
│   ├── auth/                    # Auth utilities
│   ├── notifications/           # SMS triggers
│   ├── cron/                    # Scheduled jobs
│   ├── i18n/                    # Translations
│   └── types/                   # TypeScript types
│
├── public/
│   ├── sw.js                    # Service worker (offline)
│   ├── manifest.json            # PWA manifest
│   └── pwa/                     # Icons & screenshots
│
└── db/
    ├── 01-schema.sql            # Database tables
    ├── 02-policies.sql          # Row-level security
    └── 03-triggers.sql          # Automated triggers
```

---

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm run test

# Format code
npm run format

# Type check
npm run type-check

# Analyze bundle size
npm run analyze
```

---

## 🐛 Common Issues

### Issue: "Cannot find module supabase"

**Fix:**
```bash
npm install @supabase/supabase-js
```

### Issue: "NEXT_PUBLIC_SUPABASE_URL is missing"

**Fix:**
1. Check `.env.local` exists
2. Restart dev server: `npm run dev`
3. Verify env vars loaded: Check console at startup

### Issue: SMS not sending

**Check:**
1. Credentials in `.env.local`?
2. Twilio/SSLCommerz account active?
3. Phone number format correct (Bangladesh: +880)?
4. Check `api/notifications/send.ts` error logs

### Issue: PWA won't install

**Check:**
1. Using HTTPS (not localhost for real test)
2. Icons exist in `public/pwa/`
3. `manifest.json` valid: Use [Manifest Validator](https://www.pwabuilder.com/manifest-validator)
4. Service worker registered: DevTools → Application → Service Workers

### Issue: Database connection fails

**Check:**
1. Supabase project running?
2. URL & keys copied correctly?
3. Copy again carefully (spaces matter!)
4. Restart dev server after changing `.env.local`

---

## 📚 Learn More

Each major feature has detailed documentation:

| Step | Feature | Documentation |
|------|---------|----------------|
| 1 | Database Schema | `db/README.md` |
| 2 | Authentication | `lib/auth/README.md` |
| 3 | NID Verification | `lib/auth/nid.ts` |
| 4 | Product Listing | `components/products/README.md` |
| 5 | Order Placement | `components/orders/README.md` |
| 6 | Agent PWA | `lib/pwa/README.md` |
| 7 | Admin Dashboard | `components/admin/README.md` |
| 8 | Refunds | `components/refunds/README.md` |
| 9 | Notifications | `lib/notifications/README.md` `NOTIFICATION_SETUP.md` |
| 10 | Cron Jobs | `lib/cron/README.md` `CRON_SETUP.md` |
| 11 | Translations | `lib/i18n/README.md` `I18N_SETUP.md` |
| 12 | PWA Finalization | `PWA_SETUP.md` |

---

## 🚀 Next Steps

### For Development:
1. ✅ Installed dependencies
2. ✅ Setup Supabase
3. ✅ Created `.env.local`
4. ✅ Ran `npm run dev`
5. 📝 (Next) Try all 4 user roles
6. 📝 (Next) Test order placement
7. 📝 (Next) Check admin dashboard

### For Deployment:
1. Generate PWA icons (see `PWA_SETUP.md`)
2. Follow `DEPLOYMENT_GUIDE.md`
3. Choose Vercel or self-hosted
4. Deploy to production!

---

## 📞 Support

### Stuck? Check:
- Console logs: `F12` → Console tab
- Network tab: `F12` → Network
- Supabase logs: Dashboard → Logs
- Error page: DevTools → Issues panel

### Ask:
- Documentation: Each section has links
- Code: Check comments in source files
- TypeScript: Hover over variables for hints

---

## ✨ Tips & Tricks

### Speed Up Development

1. **Use Chrome DevTools:**
   - F12 → Application → Service Workers (debug offline)
   - F12 → Network → Throttle 3G (test slow connection)

2. **Format Code:**
   ```bash
   npm run format
   ```

3. **Type Check:**
   ```bash
   npm run type-check
   ```

4. **Monitor Builds:**
   ```bash
   npm run analyze
   ```

### Test All Features Quickly

```typescript
// In browser console while logged in:

// Check user role:
console.log(localStorage.getItem('user-role'))

// Simulate offline:
// DevTools → Network → Offline

// Clear cache:
// DevTools → Application → Clear storage
```

---

## 🎓 Learning Path

**Day 1: Fundamentals**
- [ ] Login as all 4 roles
- [ ] Understand database schema (Step 1)
- [ ] Trust Level: Basic

**Day 2: Core Features**
- [ ] Create product (Seller)
- [ ] Place order (Customer)
- [ ] Collect order (Pickup Agent)
- [ ] Approve NID (Admin)
- [ ] Trust Level: Intermediate

**Day 3: Advanced Features**
- [ ] Trigger refund (Customer)
- [ ] Admin approval (Admin)
- [ ] Check notifications (SMS logs)
- [ ] Offline order placement
- [ ] Trust Level: Advanced

**Day 4+: Deployment**
- [ ] Generate PWA icons
- [ ] Deploy to Vercel/AWS
- [ ] Monitor with Sentry
- [ ] Trust Level: Production-Ready

---

## 🎉 You're Ready!

Your FreshMarket BD development environment is set up. Start with:

```bash
npm run dev
# Then go to http://localhost:3000
```

Welcome to FreshMarket BD! 🚀

**Next: Read [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) when ready to go live**
