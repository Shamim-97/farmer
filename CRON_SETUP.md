# FreshMarket BD - Cron Jobs Setup Guide

## Overview

This guide explains how to set up automated cron jobs for FreshMarket BD. These jobs handle:
- Abandoned order cleanup (hourly)
- Daily threshold resets (midnight UTC)
- Agent earnings reports (2 AM UTC)
- Refund expiry cleanup (3 AM UTC)
- Notification cleanup (every 6 hours)
- Seller inactivity checks (4 AM UTC)

## API Endpoints

All cron endpoints are available at:
```
https://your-domain.com/api/cron/{job-name}
```

Available endpoints:
- `POST /api/cron/abandoned-orders`
- `POST /api/cron/threshold-reset`
- `POST /api/cron/agent-earnings`
- `POST /api/cron/refund-expiry`
- `POST /api/cron/notification-cleanup`
- `POST /api/cron/seller-inactivity`

## Authentication

All requests require Bearer token authentication in the header:

```
Authorization: Bearer YOUR_CRON_SECRET
```

Set the `CRON_SECRET` environment variable in your `.env.local` or Vercel:

```bash
CRON_SECRET=your-secure-random-string
```

Generate a secure token:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Option 1: Vercel Cron Jobs

### Setup (Next.js 13.4+)

1. **Create Vercel Cron Routes** (Already created in `app/api/cron/`)
2. **Add vercel.json**:

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

3. **Deploy to Vercel** (Vercel automatically handles cron jobs with Bearer token)

## Option 2: EasyCron Service

### Setup

1. Go to [EasyCron](https://www.easycron.com)
2. Sign up and create a new cron job
3. Fill in the form:

**For Abandoned Orders (Every 1 hour):**
- **URL**: `https://your-domain.com/api/cron/abandoned-orders`
- **HTTP method**: `POST`
- **HTTP headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Execution interval**: Every 1 hour (Cron: `0 * * * *`)

**For Threshold Reset (Daily at Midnight UTC):**
- **URL**: `https://your-domain.com/api/cron/threshold-reset`
- **HTTP method**: `POST`
- **HTTP headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Execution interval**: Daily at 00:00 (Cron: `0 0 * * *`)

**For Agent Earnings (Daily at 2 AM UTC):**
- **URL**: `https://your-domain.com/api/cron/agent-earnings`
- **HTTP method**: `POST`
- **HTTP headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Execution interval**: Daily at 02:00 (Cron: `0 2 * * *`)

**For Refund Expiry (Daily at 3 AM UTC):**
- **URL**: `https://your-domain.com/api/cron/refund-expiry`
- **HTTP method**: `POST`
- **HTTP headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Execution interval**: Daily at 03:00 (Cron: `0 3 * * *`)

**For Notification Cleanup (Every 6 hours):**
- **URL**: `https://your-domain.com/api/cron/notification-cleanup`
- **HTTP method**: `POST`
- **HTTP headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Execution interval**: Every 6 hours (Cron: `0 */6 * * *`)

**For Seller Inactivity (Daily at 4 AM UTC):**
- **URL**: `https://your-domain.com/api/cron/seller-inactivity`
- **HTTP method**: `POST`
- **HTTP headers**: `Authorization: Bearer YOUR_CRON_SECRET`
- **Execution interval**: Daily at 04:00 (Cron: `0 4 * * *`)

## Option 3: AWS EventBridge (Lambda)

### Setup

1. Create Lambda function:
```bash
npm install aws-sdk
```

2. Create a Lambda handler:
```typescript
import fetch from 'node-fetch';

export async function handler() {
  const response = await fetch('https://your-domain.com/api/cron/{job}', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });
  return response.json();
}
```

3. Create EventBridge Rule:
- EventBridge → Rules → Create rule
- Schedule expression: `cron(0 * * * ? *)` (every hour)
- Target: Lambda function
- Set environment variable: `CRON_SECRET`

## Option 4: GitHub Actions

### Setup

1. Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs

on:
  schedule:
    # Every hour
    - cron: '0 * * * *'

jobs:
  abandoned-orders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger abandoned orders cleanup
        run: |
          curl -X POST https://your-domain.com/api/cron/abandoned-orders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  threshold-reset:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger threshold reset
        run: |
          curl -X POST https://your-domain.com/api/cron/threshold-reset \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

2. Add `CRON_SECRET` to GitHub Secrets

## Cron Job Details

### 1. Abandoned Orders Cleanup
**Schedule**: Every 1 hour
**Action**: Marks PENDING/CONFIRMED orders as ABANDONED if > 24 hours old
**Side Effects**:
- Recalculates village thresholds
- Sends SMS notification to customer

### 2. Daily Threshold Reset
**Schedule**: Daily at 00:00 UTC (midnight)
**Action**: Resets all village `current_total_kg` to 0 for new day

### 3. Agent Earnings Report
**Schedule**: Daily at 02:00 UTC
**Action**: Sends daily earnings summary SMS to all agents
**Message Format**: "💰 Daily Earnings: ৳{amount}. {orders} orders collected. Month total: ৳{total}"

### 4. Refund Expiry Cleanup
**Schedule**: Daily at 03:00 UTC
**Action**: Marks PENDING/APPROVED refunds > 30 days old as EXPIRED

### 5. Notification Cleanup
**Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
**Action**: Deletes notifications older than 90 days

### 6. Seller Inactivity Check
**Schedule**: Daily at 04:00 UTC
**Action**: Deactivates sellers with no orders in last 30 days

## Testing

Test cron jobs locally:

```bash
# Install test tool
npm install -g curl

# Test abandoned orders
curl -X POST http://localhost:3000/api/cron/abandoned-orders \
  -H "Authorization: Bearer your-test-secret"

# Expected response:
# {
#   "success": true,
#   "message": "5 orders marked as abandoned"
# }
```

## Monitoring

### Check Logs

**Vercel Logs**:
```bash
vercel logs https://your-domain.com/api/cron/abandoned-orders
```

**EasyCron Dashboard**: View execution history and error logs

### Error Handling

All cron jobs include error handling:
- Failed jobs return 500 status code
- Error details logged to Supabase/Vercel logs
- Notifications won't crash the job (non-blocking)

### Alerts

Recommended monitoring:
1. Set up Sentry or Datadog for error tracking
2. Create alerts for failed cron jobs
3. Monitor response times in Vercel Analytics

## Environment Variables

Add to `.env.local` or Vercel Settings:

```env
# Required
CRON_SECRET=your-secure-random-string

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Database Schema Requirements

Ensure these tables exist with proper columns:
- `orders` - status, created_at, payment_status, village_id
- `villages` - current_total_kg
- `refund_requests` - status, requested_at, payment_status
- `profiles` - role, phone, is_active
- `notifications` - created_at
- `collection_proofs` - agent_id, amount, created_at

All created in Step 1 (schema migration).

## Troubleshooting

### Issue: "Unauthorized" error
**Solution**: Verify `CRON_SECRET` matches between `.env` and cron service

### Issue: Orders not marked as abandoned
**Solution**: Check if orders have `created_at` timestamp set

### Issue: SMS not sent to agents
**Solution**: Verify agents have phone numbers in profiles table

### Issue: Threshold not resetting
**Solution**: Ensure all villages have `current_total_kg` column

## Rollback / Disable

To disable a cron job:

**Vercel**: Remove from `vercel.json` and redeploy

**EasyCron**: Disable schedule in dashboard

**GitHub Actions**: Disable workflow in `.github/workflows/`

## Best Practices

1. ✅ Use secure, random CRON_SECRET
2. ✅ Test jobs before deploying to production
3. ✅ Monitor job execution logs weekly
4. ✅ Set alerts for failed jobs
5. ✅ Review abandoned order cleanup weekly
6. ✅ Verify threshold resets daily (spot-check villages)
7. ✅ Test SMS delivery for agent earnings

## Production Deployment Checklist

- [ ] `.env.local` has CRON_SECRET set
- [ ] Vercel deployed with `vercel.json`
- [ ] EasyCron / EventBridge cron jobs configured
- [ ] All cron endpoints return 200 status on test call
- [ ] Supabase database has all required tables
- [ ] SMS provider credentials configured for notifications
- [ ] Error monitoring (Sentry/Datadog) set up
- [ ] Team alerted about cron schedules in documentation
