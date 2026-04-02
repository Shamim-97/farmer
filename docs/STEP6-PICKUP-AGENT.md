# Step 6: Pickup Agent Dashboard (PWA)

## Overview

Complete Progressive Web App (PWA) for pickup agents to collect orders with offline-first capability.

## Features Implemented

### ✅ PWA Configuration
- `public/manifest.json` - Web app manifest with icons, shortcuts, theme colors
- `public/service-worker.js` - Service worker for offline caching, background sync
- `lib/pwa/offline.ts` - PWA utilities (registration, offline storage, IndexedDB)
- `public/offline.html` - Offline fallback page
- Root layout with PWA metadata + Apple Web App configuration

### ✅ Pickup Agent System

#### Database Schema
- `collection_proofs` - Photo proofs with GPS coordinates
- `pickup_agent_sessions` - Agent duty sessions tracking
- RLS policies for agent/admin access
- Storage bucket `collection_proofs` for images

#### Server Actions (`lib/pickup-agent/actions.ts`)
- `getPickupAgentProfile()` - Get assigned pickup point
- `getPickupPointOrders()` - Get READY orders for agent's point
- `collectOrder()` - Mark order collected with GPS + photo
- `getAgentEarnings()` - Today/week/month statistics
- `startDutySession()` - Begin work shift
- `endDutySession()` - End work shift
- `updateAgentLocation()` - Track GPS during shift

#### API Routes
- POST `/api/collect-order` - Upload collection proof + mark order collected

#### UI Components
- `AgentDashboard` - Main orders view with duty session start
- `OrderCollectionCard` - Camera capture + photo upload for each order
- `AgentEarningsPanel` - Statistics display (today/week/month)
- `PwaInitializer` - Service worker registration

#### Pages
- `/agent` - Main agent dashboard (orders + earnings tabs)
- `/agent/layout.tsx` - PWA metadata for agent routes

## Business Rules Implemented

### Order Collection
1. Agent taps "Start Duty" to begin shift (creates session)
2. Views all READY orders at their assigned pickup point
3. For each order:
   - Take photo with device camera (or upload from gallery)
   - GPS location auto-recorded
   - Marks order as COLLECTED
   - Stores proof in collection_proofs table

### Earnings Calculation
- **Rate**: 30% commission on delivery_fee
- **Formula**: `(order.delivery_fee * 0.3)`
- **Tracking**: Daily by midnight, weekly, monthly totals
- **Display**: Real-time counter in dashboard

### Offline Support
- Service worker caches all app resources
- Network-first for navigation, stale-while-revalidate for API
- IndexedDB storage for pending uploads
- Background sync when connection restored
- Offline page shown if no cached content

## Technical Implementation

### Offline Strategy

**Service Worker Strategies:**
1. **Navigate (HTML pages)**: Network-first → Cache → Offline page
2. **API Calls**: Stale-while-revalidate (serve cached, fetch new)
3. **Static Assets (JS/CSS/images)**: Cache-first → Network

**Data Storage:**
- IndexedDB for structured data (orders, proofs)
- LocalStorage fallback for simple key-value
- Photos: Blob storage in IndexedDB until sync

**Background Sync:**
- `sync` event with tag `sync-collection-proofs`
- Batches pending photo uploads
- Retries on failure

### PWA Features

**Installation:**
- Add-to-home-screen on Android
- Install to Dock on iOS (via "Share" > "Add to Home Screen")
- Standalone app icon + splash screen
- Web App Manifest defines app identity

**Capabilities:**
- Camera API for photo capture
- Geolocation API for GPS tracking
- Storage API for offline data
- Fullscreen display mode
- Custom theme color (#059669 green)

## Database Schema

### collection_proofs Table
```sql
id UUID PRIMARY KEY
order_id UUID (FK)
agent_id UUID (FK)
gps_lat DECIMAL(10, 8)
gps_lng DECIMAL(11, 8)
photo_url TEXT
timestamp TIMESTAMP
signature_data TEXT (optional)
created_at TIMESTAMP
```

### pickup_agent_sessions Table
```sql
id UUID PRIMARY KEY
agent_id UUID (FK)
pickup_point_id UUID (FK)
status VARCHAR(20) -- ON_DUTY, ON_BREAK, OFF_DUTY
start_time TIMESTAMP
end_time TIMESTAMP (nullable)
gps_lat DECIMAL(10, 8)
gps_lng DECIMAL(11, 8)
orders_collected INTEGER
earnings DECIMAL(10, 2)
created_at TIMESTAMP
```

## Security

### RLS Policies
- ✅ Agents can only view/collect READY orders at their assigned point
- ✅ Agents can only view/update their own sessions
- ✅ Admins can view all collection proofs + sessions
- ✅ Storage: agents upload to `{user_id}/` folder only

### API Protection
- ✅ getCurrentUser() check on all endpoints
- ✅ Pickup point assignment verification
- ✅ Order status validation (READY only)
- ✅ Photo file validation (JPEG/PNG, < 5MB)

## User Flows

### Daily Pickup Agent Workflow

1. **Start of Shift:**
   - Open `/agent` on mobile device
   - Tap "Start Duty Session" button
   - Creates pickup_agent_sessions record
   - Shows list of READY orders

2. **During Shift:**
   - For each order in the list:
     - Card displays: customer name, quantity, payment status, price
     - Tap "Collect Order" card
     - Opens camera or file upload
     - Captures/uploads photo
     - GPS coordinates auto-recorded
     - Order marked COLLECTED
     - Removed from list, earning logged

3. **Earnings Tracking:**
   - Real-time counter shows today's collections
   - Tab shows week/month statistics
   - Average per order displayed
   - Last collection time

4. **End of Shift:**
   - End duty session (or app auto-ends at midnight)
   - Earnings finalized
   - Ready for next day

## Testing Checklist

- [ ] Agent can start duty session
- [ ] Agent views READY orders for their pickup point
- [ ] Camera capture works on mobile
- [ ] Photo upload works
- [ ] GPS location recorded with order
- [ ] Order status changes to COLLECTED
- [ ] Earnings calculated correctly (30% of fee)
- [ ] Real-time stats update
- [ ] Offline mode caches orders
- [ ] Background sync retries failed uploads
- [ ] PWA installs on home screen
- [ ] Service worker updates every 60 min
- [ ] Admin can view all collection proofs
- [ ] RLS policies enforce access control

## Performance Optimizations

- ✅ Service Worker caches static assets (JS/CSS < 50KB)
- ✅ Images lazy-loaded with blur effect
- ✅ IndexedDB for fast local queries
- ✅ Background sync batches uploads
- ✅ 30-second refresh interval for orders
- ✅ Realtime subscriptions for live updates (future)

## Files Created/Modified

**New Files (13):**
- `public/manifest.json` - PWA manifest
- `public/service-worker.js` - Offline service worker
- `public/offline.html` - Offline fallback page
- `lib/types/pickup-agent.ts` - Types + interfaces
- `lib/pickup-agent/actions.ts` - Server actions
- `lib/pwa/offline.ts` - PWA utilities
- `components/pickup-agent/agent-dashboard.tsx` - Main dashboard
- `components/pickup-agent/order-collection-card.tsx` - Order collection UI
- `components/pickup-agent/agent-earnings.tsx` - Earnings display
- `components/pwa-initializer.tsx` - Service worker init
- `app/agent/page.tsx` - Agent dashboard page
- `app/agent/layout.tsx` - Agent layout with PWA metadata
- `app/api/collect-order/route.ts` - Collection API endpoint
- `supabase/migrations/04-pickup-agent-system.sql` - Database migrations
- `app/layout.tsx` - Root layout with PWA config

**Modified Files (1):**
- None (new project structure)

## Next Steps (Step 7)

- Live order admin panel with map view
- Real-time tracking of agents on map
- Order status dashboard for admins
- Collection proof gallery + review
- Agent performance metrics
