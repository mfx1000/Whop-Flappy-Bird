// app/api/webhooks/whop/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// This function verifies that the webhook request is genuinely from Whop
async function verifyWebhook(request: NextRequest, body: string) {
  const signature = request.headers.get('x-whop-signature');
  const timestamp = request.headers.get('x-whop-timestamp');
  const secret = process.env.WHOP_WEBHOOK_SECRET;

  if (!signature || !timestamp || !secret) {
    return false;
  }

  const signedPayload = `${timestamp}.${body}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // 1. Verify the webhook signature for security
    const isValid = await verifyWebhook(request, rawBody);
    if (!isValid) {
      console.warn('Invalid webhook signature received.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const data = JSON.parse(rawBody);

    // 2. We only care about successful payment events
    if (data.event === 'payment.succeeded') {
      const payment = data.payload;

      // 3. Extract the necessary information from the webhook payload
      const paymentId = payment.id; // e.g., 'pay_...'
      const netAmountCents = payment.net_amount_cents;
      const metadata = payment.metadata;
      const tournamentId = metadata?.tournamentId;
      const companyId = metadata?.companyId;

      // 4. Validate that we have all the info we need
      if (!paymentId || !netAmountCents || !tournamentId || !companyId) {
        console.error('Webhook received with missing data:', payment);
        return NextResponse.json({ error: 'Webhook payload missing required fields.' }, { status: 400 });
      }

      // 5. Save the transaction to our database
      const { error } = await supabaseAdmin.from('transactions').insert({
        id: paymentId,
        tournament_id: tournamentId,
        company_id: companyId,
        net_amount_cents: netAmountCents,
      });

      if (error) {
        console.error('Error inserting transaction into database:', error);
        throw error;
      }

      console.log(`Successfully logged transaction: ${paymentId}`);
    }

    // 6. Respond to Whop to acknowledge receipt of the webhook
    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error('Webhook processing failed:', errorMessage);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
