// app/api/join/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // FIX #1: Added 'await' before headers()
    const user = await whopSdk.verifyUserToken(await headers());
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Define the charge details
    const chargeDetails = {
      amount: 2.00, // $2.00 USD
      // FIX #2: Added 'as const' to satisfy the strict 'Currencies' type
      currency: "usd" as const,
      userId: user.userId,
      metadata: {
        tournamentId: new Date().toISOString().split("T")[0], // e.g., "2025-06-25"
      },
    };

    // 3. Create the charge using the Whop SDK
    const charge = await whopSdk.payments.chargeUser(chargeDetails);

    // 4. If the charge is successful or needs confirmation, return the details
    if (charge?.inAppPurchase) {
      return NextResponse.json(charge.inAppPurchase);
    } else {
      throw new Error("Failed to create charge");
    }
  } catch (error) {
    console.error("Error creating charge:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Failed to create charge: ${errorMessage}` }, { status: 500 });
  }
}