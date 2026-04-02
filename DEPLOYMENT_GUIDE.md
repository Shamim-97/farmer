# FreshMarket BD - Complete Deployment & Build Guide

## 🎉 Project Complete: 12/12 Steps

All 12 major features for FreshMarket BD are now complete and ready for production deployment.

## Project Summary

### What We Built

**FreshMarket BD** is a comprehensive mobile-first marketplace for fresh vegetables and organic produce in Bangladesh with:

#### ✅ Step 1: SQL Schema
- 7 production-ready tables with RLS & indexes
- Supabase storage for NID documents & collection photos
- Automated triggers for notifications & thresholds

#### ✅ Step 2: Authentication
- Supabase Auth with role-based access control (CUSTOMER, SELLER, PICKUP_AGENT, ADMIN)
- Middleware guards & protected routes
- Social login ready

#### ✅ Step 3: NID Verification 
- Seller identity verification workflow
- Admin approval/rejection with SMS notifications
- RULE 2: NID gate prevents non-verified sellers

#### ✅ Step 4: Product Listing
- Complete product CRUD with images
- Full-text search by name
- Seller dashboard with stock management
- NID verification requirement

#### ✅ Step 5: Order Placement
- RULE 1: 10 PM order lock (6 AM - 10 PM window enforced)
- RULE 3: Village threshold engine (free delivery at {min_kg} total orders)
- Live progress bar, real-time delivery fee calculation
- Payment integration ready (Stripe)

#### ✅ Step 6: Pickup Agent PWA  
- Offline-first mobile app (works without internet)
- GPS tracking, camera photo capture for collection proof
- Real-time earnings tracking
- Service Worker caching, IndexedDB persistence

#### ✅ Step 7: Admin Dashboard
- Live order tracking with real-time Supabase subscriptions
- Agent location heatmap
- Revenue analytics & charts
- Collection gallery with photo proof
- 4 main tabs: Orders, Agents, Analytics, Collections

#### ✅ Step 8: Refund System
- Customer refund requests within 7-day window
- Proof upload (photos/videos)
- Admin approval/rejection workflow
- Payment processing integration
- Reason categories: Damage, Not Described, Changed Mind

#### ✅ Step 9: Notification Triggers
- SMS/WhatsApp on all status changes
- 16 notification types (orders, refunds, NID, agent earnings)
- Database persistence with delivery tracking
- Non-blocking (won't fail orders if SMS fails)
- Bangladesh localization (৳ currency, emojis, timezone)

#### ✅ Step 10: Cron Jobs
- 6 automated jobs (abandoned orders, threshold reset, earnings reports, etc.)
- Vercel Cron, EasyCron, AWS EventBridge compatible
- Bearer token authentication for security
- Comprehensive setup guide with examples

#### ✅ Step 11: Bangla Translations
- 300+ translation strings (EN + BN)
- React Context provider (no heavy i18n libraries)
- localStorage persistence
- Mobile-friendly language switcher
- Examples for all major flows

#### ✅ Step 12: PWA Finalization
- Installable app (Android & iOS)
- Standalone mode (no browser UI)
- Adaptive icons, splash screens
- Install prompt with 7-day dismiss
- Manifest with shortcuts & share target

---

## 📋 Pre-Deployment Checklist

### Environment Setup

- [ ] **Supabase Project Created**
  ```bash
  # Get these from Supabase Dashboard
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```

- [ ] **Database Migrations**
  ```bash
  # Run all 4 SQL migrations
  supabase db push
  # Or manually execute: db/01-schema.sql, 02-*.sql, etc.
  ```

- [ ] **Supabase Storage Buckets**
  - `nid-documents` (NID photos)
  - `collection_proofs` (order collection photos)
  - `product-images` (product photos)
  - Settings: Public read, authenticated upload

- [ ] **SMS Provider Setup** (Twilio OR SSLCommerz)
  ```bash
  # For Twilio
  TWILIO_ACCOUNT_SID=
  TWILIO_AUTH_TOKEN=
  TWILIO_PHONE_NUMBER=
  
  # OR SSLCommerz
  SSLCOMMERZ_STORE_ID=
  SSLCOMMERZ_STORE_PASSWORD=
  SSLCOMMERZ_API_URL=
  ```

- [ ] **Payment Gateway** (Stripe)
  ```bash
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
  STRIPE_SECRET_KEY=
  ```

- [ ] **Cron Secret**
  ```bash
  CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  # Copy to .env.local and Vercel
  ```

### Code Preparation

- [ ] Remove console.log statements (or use Logger in prod)
- [ ] Set NODE_ENV=production
- [ ] Run linter: `npm run lint`
- [ ] Run tests: `npm run test`
- [ ] Build locally: `npm run build` (should succeed)
- [ ] Check build size: build should be < 200MB

### Asset Preparation

- [ ] **Generate PWA Icons** (place in `public/pwa/`)
  - icon-192.png, icon-192-maskable.png
  - icon-256.png, icon-512.png, icon-512-maskable.png
  - All PNG format, correct dimensions

- [ ] **Create Screenshots**
  - screenshot-mobile.png (540x720)
  - screenshot-tablet.png (1280x800)
  - Show real app UI

- [ ] **Favicons**
  - favicon.ico (16x16, 32x32, 48x48)
  - apple-touch-icon-180.png (180x180)

- [ ] **Translation Strings**
  - All customer-facing text in bn.ts & en.ts ✅

### Security Audit

- [ ] **RLS Policies** - All tables have Row Level Security enabled
- [ ] **API Keys** - Service role key never exposed in client code
- [ ] **CORS** - Supabase CORS configured for your domain
- [ ] **Secrets** - No hardcoded API keys in code
- [ ] **HTTPS** - Enabled on production domain
- [ ] **CSP Headers** - Content Security Policy configured
- [ ] **CSRF Protection** - Enabled for forms

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

**Why Vercel?**
- Built for Next.js (native support)
- Auto-scaling, global CDN
- Native Cron Jobs support
- Environment variables in UI
- Auto-deploy on git push

**Steps:**

1. **Connect GitHub Repository**
   ```bash
   git remote add origin https://github.com/yourusername/farmer.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to vercel.com → Import Project
   - Select GitHub repo
   - Select "Next.js" framework

3. **Set Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_PHONE_NUMBER=
   STRIPE_SECRET_KEY=
   CRON_SECRET=
   ```

4. **Create `vercel.json`** (for Cron Jobs)
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/abandoned-orders",
         "schedule": "0 * * * *"
       },
       {
         "path": "/api/cron/threshold-reset",
         "schedule": "0 0 * * *"
       },
       {
         "path": "/api/cron/agent-earnings",
         "schedule": "0 2 * * *"
       },
       {
         "path": "/api/cron/refund-expiry",
         "schedule": "0 3 * * *"
       },
       {
         "path": "/api/cron/notification-cleanup",
         "schedule": "0 */6 * * *"
       },
       {
         "path": "/api/cron/seller-inactivity",
         "schedule": "0 4 * * *"
       }
     ]
   }
   ```

5. **Deploy**
   ```bash
   git commit -m "Deploy Step 12: PWA Finalization"
   git push
   # Vercel auto-deploys
   ```

### Option 2: Self-Hosted (AWS/DigitalOcean)

**Setup EC2/Droplet:**

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/yourusername/farmer.git
cd farmer

# Install dependencies
npm install

# Build
npm run build

# Install PM2 for process management
npm install -g pm2

# Start app
pm2 start "npm start" --name "farmer"
pm2 startup
pm2 save
```

**Setup Nginx Reverse Proxy:**

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

**Setup HTTPS with Let's Encrypt:**

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**Setup Cron Jobs:**

```bash
# Use EasyCron or set up local cron
crontab -e

# Add entries:
0 * * * * curl -X POST https://yourdomain.com/api/cron/abandoned-orders \
  -H "Authorization: Bearer $CRON_SECRET"
0 0 * * * curl -X POST https://yourdomain.com/api/cron/threshold-reset \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## 🧪 Post-Deploy Testing

### 1. Functionality Testing

**Auth Flow:**
```bash
# Sign up as each role
1. Customer → Order products
2. Seller → Upload NID → Admin approves → Add products
3. Agent → Start duty → Collect order
4. Admin → Approve/reject NID & refunds
```

**Order Workflow:**
- [ ] Place order (6 AM - 10 PM only)
- [ ] Order appears to seller
- [ ] Seller confirms → order status changes
- [ ] SMS notification sent to customer
- [ ] Order ready → Agent collects
- [ ] SMS: "Order Collected"

**Refund Workflow:**
- [ ] Request refund (within 7 days)
- [ ] Upload proof
- [ ] Admin approves/rejects
- [ ] SMS sent to customer
- [ ] Payment processed

### 2. PWA Testing

```bash
# iOS
1. Safari → Share → Add to Home Screen
2. Verify offline access
3. Check home screen icon

# Android
1. Chrome → Menu → Install App
2. Accept install prompt
3. Verify standalone mode
4. Go offline, navigate
```

### 3. Performance Testing

Use Lighthouse:
```bash
# Chrome DevTools → Lighthouse
# Target: 90+ score on all categories

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100
- PWA: OK (all checks passing)
```

### 4. Load Testing

Use k6 or Artillery:

```bash
# Test API endpoints under load
artillery quick -c 100 -d 60 https://yourdomain.com/api/products
```

### 5. Real Device Testing

- [ ] Test on real Android phone (offline mode)
- [ ] Test on real iPhone (offline mode)
- [ ] Test on tablet (responsive layout)
- [ ] Test slow 3G (throttle in DevTools)
- [ ] Test on old device (iOS 12+, Android 5+)

---

## 📊 Monitoring & Analytics

### Application Monitoring

**Sentry (Error Tracking):**
```bash
npm install @sentry/nextjs

# In instrumentation.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Vercel Analytics:**
- Vercel Dashboard → Analytics
- Monitor response times, build times
- View traffic patterns

### Database Monitoring

**Supabase:**
- Dashboard → Logs → Monitor queries
- Check for slow queries
- View auth activity
- Storage usage

### PWA Analytics

```typescript
// Track installs
gtag('event', 'app_install', {
  event_category: 'engagement',
  event_label: 'pwa_installed',
});

// Track offline usage
if (!navigator.onLine) {
  gtag('event', 'offline_usage', {
    event_category: 'engagement',
  });
}
```

---

## 🔒 Security Hardening

### 1. Environment Variables

Never commit `.env.local`! Use:
```bash
echo ".env.local" >> .gitignore
```

For Vercel: Settings → Environment Variables

### 2. API Rate Limiting

In `middleware.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### 3. Input Validation

All forms already validate, but add server-side too:
```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^01[3-9]\d{8}$/), // Bangladesh format
});
```

### 4. CORS Headers

In `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: "/api/:path*",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: process.env.ALLOWED_ORIGINS || "*",
        },
      ],
    },
  ];
}
```

### 5. CSP Headers

```javascript
headers: [
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  },
]
```

---

## 📈 Performance Optimization

### Build Size

```bash
# Analyze bundle
npm install --save-dev @next/bundle-analyzer

# Check size
npm run analyze

# Target: < 200KB gzipped
```

### Image Optimization

```typescript
import Image from 'next/image';

// Already optimizing, but check:
// - WebP format
// - Responsive breakpoints
// - Lazy loading
```

### Database Indexes

✅ Already configured in Step 1

### Caching Strategy

```typescript
// Already in Service Worker (Step 6)
// - Network first for API
// - Cache first for assets
// - Stale while revalidate for products
```

---

## 📱 Rollout Strategy

### Phase 1: Soft Launch (Week 1)
- Deploy to staging: staging.freshmarket-bd.com
- Test with 10 internal users
- Fix critical bugs

### Phase 2: Beta Launch (Week 2-3)
- Deploy to production
- Invite 100 beta users
- Monitor Sentry errors
- Gather feedback

### Phase 3: Public Launch (Week 4+)
- Open to all customers
- Multi-channel marketing
- 24/7 support ready

### Phase 4: Scale
- Monitor server performance
- Scale Supabase if needed
- Optimize based on usage patterns

---

## 🆘 Emergency Procedures

### If Service Goes Down

1. **Check Status:**
   ```bash
   # Ping API
   curl https://yourdomain.com/api/health
   
   # Check Supabase status
   # https://status.supabase.com
   ```

2. **Restart Application:**
   ```bash
   # Vercel: Redeploy from dashboard
   # Self-hosted: pm2 restart farmer
   ```

3. **Rollback:**
   ```bash
   git revert <commit-hash>
   git push
   # Vercel auto-redeploys
   ```

4. **Check Logs:**
   - Vercel: Deployments → Logs
   - Self-hosted: `pm2 logs`
   - Sentry: Dashboard → Issues

---

## 📚 Documentation Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Deployment](https://vercel.com/docs)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [i18n Setup](./I18N_SETUP.md)
- [Cron Jobs](./CRON_SETUP.md)
- [PWA Guide](./PWA_SETUP.md)

---

## ✅ Final Deployment Checklist

**Before Going Live:**

- [ ] All 12 features fully implemented & tested
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] PWA icons & screenshots ready
- [ ] Monitoring (Sentry, Analytics) enabled
- [ ] Cron jobs scheduled
- [ ] SMS provider configured & tested
- [ ] Payment gateway tested (Stripe)
- [ ] HTTPS enabled on domain
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Backup strategy documented
- [ ] Support channels set up
- [ ] Status page deployed
- [ ] Read-only database backups automated

**Congratulations! 🎉**

Your FreshMarket BD marketplace is ready for production!
