// app/api/join/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user and get their company ID
    const user = await whopSdk.verifyUserToken(await headers());
    const companyId = (user as { companyId?: string })?.companyId;

    if (!user || !companyId) {
      return NextResponse.json({ error: "Unauthorized or company not found." }, { status: 401 });
    }

    // 2. Fetch the custom entry fee for this specific company
    const { data: companySettings } = await supabaseAdmin
      .from("companies")
      .select("entry_fee_cents")
      .eq("id", companyId)
      .single();

    // Default to 200 cents ($2.00) if no price is set
    const priceInCents = companySettings?.entry_fee_cents || 200;

    // 3. Create the charge with the dynamic price
    const chargeDetails = {
      amount: priceInCents / 100, // Convert cents to dollars
      currency: "usd" as const,
      userId: user.userId,
      // We associate the payment with both the tournament and the company
      metadata: {
        tournamentId: new Date().toISOString().split("T")[0],
        companyId: companyId,
      },
    };

    const charge = await whopSdk.payments.chargeUser(chargeDetails);

    if (charge?.inAppPurchase) {
      return NextResponse.json(charge.inAppPurchase);
    } else {
      throw new Error("Failed to create charge");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Failed to create charge: ${errorMessage}` }, { status: 500 });
  }
}
