'use server';

// Notification utilities for SMS/WhatsApp via Twilio

/**
 * Send SMS notification via Twilio
 * Types: ORDER_CONFIRMED, ORDER_READY, ORDER_ABANDONED, REFUND_APPROVED, 
 *        REFUND_REJECTED, THRESHOLD_MET, NID_APPROVED, NID_REJECTED
 */
export async function sendNIDNotification(
  phoneNumber: string,
  type: 'NID_APPROVED' | 'NID_REJECTED',
  message: string
) {
  try {
    // TODO: Call Twilio SMS API
    // const response = await fetch('https://api.twilio.com/...', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.TWILIO_AUTH_TOKEN}`,
    //   },
    //   body: JSON.stringify({
    //     to: phoneNumber,
    //     body: message,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //   }),
    // });

    console.log(`[SMS] ${type} to ${phoneNumber}: ${message}`);

    return {
      success: true,
      message: `SMS sent to ${phoneNumber}`,
    };
  } catch (err) {
    console.error('SMS notification error:', err);
    return {
      success: false,
      error: 'Failed to send SMS',
    };
  }
}

/**
 * Send WhatsApp notification via Twilio WhatsApp Business API
 */
export async function sendWhatsAppNotification(
  phoneNumber: string,
  type: string,
  message: string
) {
  try {
    // TODO: Call Twilio WhatsApp API
    console.log(`[WhatsApp] ${type} to ${phoneNumber}: ${message}`);

    return {
      success: true,
      message: `WhatsApp sent to ${phoneNumber}`,
    };
  } catch (err) {
    console.error('WhatsApp notification error:', err);
    return {
      success: false,
      error: 'Failed to send WhatsApp',
    };
  }
}

/**
 * Send order confirmation notification (SMS + WhatsApp)
 */
export async function notifyOrderConfirmed(
  phoneNumber: string,
  pickupDate: string
) {
  const message = `আপনার অর্ডার নিশ্চিত হয়েছে। পিকআপ: ${pickupDate}`;

  await sendNIDNotification(phoneNumber, 'NID_APPROVED', message);
  // Also send WhatsApp if enabled
  // await sendWhatsAppNotification(phoneNumber, 'ORDER_CONFIRMED', message);
}

/**
 * Send order ready notification
 */
export async function notifyOrderReady(phoneNumber: string) {
  const message = 'আপনার অর্ডার পিকআপ পয়েন্টে পৌঁছেছে। এখনই সংগ্রহ করুন।';

  await sendNIDNotification(phoneNumber, 'NID_APPROVED', message);
}

/**
 * Send order abandoned notification
 */
export async function notifyOrderAbandoned(phoneNumber: string) {
  const message = 'আপনার অর্ডার সংগ্রহ করা হয়নি। রিফান্ড অনুরোধ করতে পারেন।';

  await sendNIDNotification(phoneNumber, 'NID_REJECTED', message);
}

/**
 * Send refund approved notification
 */
export async function notifyRefundApproved(
  phoneNumber: string,
  amount: number
) {
  const message = `আপনার রিফান্ড ৳${amount} অনুমোদিত হয়েছে। ২৪ ঘণ্টায় আপনার ওয়ালেটে পাবেন।`;

  await sendNIDNotification(phoneNumber, 'NID_APPROVED', message);
}

/**
 * Send refund rejected notification
 */
export async function notifyRefundRejected(phoneNumber: string, reason: string) {
  const message = `আপনার রিফান্ড বাতিল হয়েছে: ${reason}`;

  await sendNIDNotification(phoneNumber, 'NID_REJECTED', message);
}

/**
 * Send village threshold met notification
 */
export async function notifyThresholdMet(phoneNumber: string, villageName: string) {
  const message = `সুখবর! ${villageName} গ্রামে ফ্রি পিকআপ নিশ্চিত হয়েছে।`;

  await sendNIDNotification(phoneNumber, 'NID_APPROVED', message);
}

/**
 * Log notification to database for tracking
 */
export async function logNotification(
  userId: string,
  type: string,
  phone: string,
  message: string
) {
  // TODO: Insert into notifications table
  console.log(`Notification logged: ${type} - ${message}`);
}
