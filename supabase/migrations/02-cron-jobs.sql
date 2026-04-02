-- supabase/migrations/02-cron-jobs.sql
-- RULE 4: THE NO-SHOW POLICY
-- Cron jobs for automated order management

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ===================================================
-- CRON JOB 1: ABANDONED ORDER POLICY
-- Runs every day at 09:01 AM (Asia/Dhaka) UTC+6
-- ===================================================

-- First, drop existing job if it exists
SELECT cron.unschedule('handle-abandoned-orders');

-- Create the cron job
SELECT cron.schedule(
  'handle-abandoned-orders',
  '1 3 * * *',  -- 09:01 AM UTC+6 = 03:01 UTC (converted to UTC for pg_cron)
  $$
  UPDATE public.orders
  SET status = 'ABANDONED'
  WHERE 
    status != 'COLLECTED'
    AND pickup_date = CURRENT_DATE
    AND payment_status = 'PAID'
  $$
);

-- ===================================================
-- CRON JOB 2: RESET VILLAGE DAILY THRESHOLD
-- Runs every day at 12:01 AM (Asia/Dhaka) UTC+6
-- ===================================================

SELECT cron.unschedule('reset-village-threshold');

SELECT cron.schedule(
  'reset-village-threshold',
  '30 17 * * *',  -- 12:01 AM UTC+6 = 18:30 UTC (converted)
  $$
  UPDATE public.villages
  SET current_total_kg = (
    SELECT COALESCE(SUM(quantity_kg), 0)
    FROM public.orders
    WHERE village_id = villages.id
    AND pickup_date = CURRENT_DATE
    AND status IN ('PENDING', 'CONFIRMED', 'READY', 'COLLECTED')
    AND payment_status = 'PAID'
  )
  $$
);

-- ===================================================
-- CRON JOB 3: EXPIRE PENDING REFUND REQUESTS
-- Runs every hour
-- ===================================================

SELECT cron.unschedule('expire-refund-requests');

SELECT cron.schedule(
  'expire-refund-requests',
  '0 * * * *',  -- Every hour
  $$
  UPDATE public.refund_requests
  SET status = 'REJECTED'
  WHERE 
    status = 'PENDING'
    AND EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 > 2
    AND proof_photo_url IS NULL
  $$
);

-- ===================================================
-- FUNCTION: Cleanup abandoned order notification
-- ===================================================

CREATE OR REPLACE FUNCTION public.notify_abandoned_orders()
RETURNS void AS $$
DECLARE
  v_order RECORD;
  v_customer RECORD;
  v_phone VARCHAR;
BEGIN
  FOR v_order IN
    SELECT id, customer_id
    FROM public.orders
    WHERE status = 'ABANDONED'
    AND updated_at > NOW() - INTERVAL '1 minute'
    AND payment_status = 'PAID'
  LOOP
    -- Get customer phone
    SELECT phone INTO v_phone
    FROM public.profiles
    WHERE id = v_order.customer_id;

    -- TODO: Send SMS via Twilio
    -- MESSAGE: "আপনার অর্ডার সংগ্রহ করা হয়নি। তবে আপনার অর্থ সংরক্ষিত আছে এবং রিফান্ড অনুরোধ করা যাবে।"

    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      phone_number
    ) VALUES (
      v_order.customer_id,
      'ORDER_ABANDONED',
      'Order Not Collected',
      'Your order was not picked up. You can request a refund.',
      v_phone
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================
-- CRON JOB 4: RUN ABANDONED ORDER NOTIFICATIONS
-- Runs at 09:05 AM daily (5 minutes after orders are marked abandoned)
-- ===================================================

SELECT cron.unschedule('notify-abandoned-orders');

SELECT cron.schedule(
  'notify-abandoned-orders',
  '5 3 * * *',  -- 09:05 AM UTC+6 = 03:05 UTC
  'SELECT public.notify_abandoned_orders()'
);

-- Note: Update these times as needed based on your pg_cron setup
-- pg_cron runs on UTC, so always convert your desired time to UTC+6 to UTC
-- 6:00 AM Asia/Dhaka (UTC+6) = 00:00 UTC (previous day)
-- 9:01 AM Asia/Dhaka (UTC+6) = 03:01 UTC
-- 10:00 PM Asia/Dhaka (UTC+6) = 16:00 UTC
-- 12:01 AM Asia/Dhaka (UTC+6) = 18:31 UTC (previous day)
