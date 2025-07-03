// app/api/join/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await whopSdk.verifyUserToken(await headers());
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chargeDetails = {
      // UPDATED: Changed amount from 1.00 to 5.00
      amount: 5.00,
      currency: "usd" as const,
      userId: user.userId,
      metadata: {
        tournamentId: new Date().toISOString().split("T")[0],
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
