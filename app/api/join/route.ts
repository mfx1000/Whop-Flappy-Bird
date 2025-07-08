// app/api/join/route.ts (Diagnostic Version)

import { WhopServerSdk } from "@whop/api";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  console.log("--- /api/join started ---");
  try {
    // 1. Authenticate the user
   //  console.log("Step 1: Authenticating user...");
    const user = await WhopServerSdk({ 
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
        appApiKey: process.env.WHOP_API_KEY!
    }).verifyUserToken(await headers());
   //  console.log("Step 1 successful. User verified.");

    if (!user || !user.userId) {
      console.error("API Join Error: Unauthorized, user or userId missing.");
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Get the experienceId from the request body
   //  console.log("Step 2: Parsing request body...");
    const { experienceId } = await request.json();
   //  console.log(`Step 2 successful. Experience ID: ${experienceId}`);

    if (!experienceId) {
        console.error("API Join Error: Experience ID is missing from request body.");
        return NextResponse.json({ error: "Experience ID is required." }, { status: 400 });
    }

    // 3. Create a new SDK instance scoped to THIS specific user
   //  console.log(`Step 3: Creating user-scoped SDK for user: ${user.userId}`);
    const userScopedSdk = WhopServerSdk({
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
        appApiKey: process.env.WHOP_API_KEY!,
        onBehalfOfUserId: user.userId,
    });
   //  console.log("Step 3 successful.");

    // 4. Use the user-scoped SDK to get the companyId
   //  console.log(`Step 4: Fetching experience details for: ${experienceId}`);
    const experience = await userScopedSdk.experiences.getExperience({ experienceId });
    const companyId = experience?.company?.id;
   //  console.log(`Step 4 successful. Company ID: ${companyId}`);

    if (!companyId) {
      console.error(`API Join Error: Company not found for experience: ${experienceId}`);
      return NextResponse.json({ error: "Company not found for this experience." }, { status: 404 });
    }

    // 5. Fetch the custom entry fee for this specific company
   //  console.log(`Step 5: Fetching settings for company: ${companyId}`);
    const { data: companySettings } = await supabaseAdmin
      .from("companies")
      .select("entry_fee_cents")
      .eq("id", companyId)
      .single();
   //  console.log("Step 5 successful. Settings:", companySettings);

    const priceInCents = companySettings?.entry_fee_cents || 200;

    // 6. Create the charge with the dynamic price
    const chargeDetails = {
      amount: priceInCents / 100,
      currency: "usd" as const,
      userId: user.userId,
      metadata: {
        tournamentId: new Date().toISOString().split("T")[0],
        companyId: companyId,
      },
    };
   //  console.log("Step 6: Creating charge with details:", chargeDetails);
    
    const charge = await userScopedSdk.payments.chargeUser(chargeDetails);
   //  console.log("Step 6 successful. Charge response:", charge);

    if (charge?.inAppPurchase) {
      console.log("--- /api/join finished successfully ---");
      return NextResponse.json(charge.inAppPurchase);
    } else {
      throw new Error("Failed to create charge. Whop API did not return inAppPurchase object.");
    }
  } catch (error) {
    console.error("--- /api/join CRASHED ---");
    console.error("Caught error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Failed to create charge: ${errorMessage}` }, { status: 500 });
  }
}


// // app/api/join/route.ts

// import { WhopServerSdk } from "@whop/api"; // Import the main SDK constructor
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function POST(request: Request) {
//   try {
//     // 1. Authenticate the user
//     const user = await WhopServerSdk({ 
//         appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
//         appApiKey: process.env.WHOP_API_KEY!
//     }).verifyUserToken(await headers());

//     if (!user || !user.userId) {
//       return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
//     }

//     // 2. Get the experienceId from the request body
//     const { experienceId } = await request.json();
//     if (!experienceId) {
//         return NextResponse.json({ error: "Experience ID is required." }, { status: 400 });
//     }

//     // 3. Create a new SDK instance scoped to THIS specific user
//     const userScopedSdk = WhopServerSdk({
//         appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
//         appApiKey: process.env.WHOP_API_KEY!,
//         onBehalfOfUserId: user.userId,
//     });

//     // 4. Use the user-scoped SDK to get the companyId
//     const experience = await userScopedSdk.experiences.getExperience({ experienceId });
//     const companyId = experience?.company?.id;

//     if (!companyId) {
//       return NextResponse.json({ error: "Company not found for this experience." }, { status: 404 });
//     }

//     // 5. Fetch the custom entry fee for this specific company
//     const { data: companySettings } = await supabaseAdmin
//       .from("companies")
//       .select("entry_fee_cents")
//       .eq("id", companyId)
//       .single();

//     // Default to 200 cents ($2.00) if no price is set
//     const priceInCents = companySettings?.entry_fee_cents || 200;

//     // 6. Create the charge with the dynamic price
//     const chargeDetails = {
//       amount: priceInCents / 100, // Convert cents to dollars
//       currency: "usd" as const,
//       userId: user.userId,
//       metadata: {
//         tournamentId: new Date().toISOString().split("T")[0],
//         companyId: companyId,
//       },
//     };

//     // Use the user-scoped SDK to create the charge
//     const charge = await userScopedSdk.payments.chargeUser(chargeDetails);

//     if (charge?.inAppPurchase) {
//       return NextResponse.json(charge.inAppPurchase);
//     } else {
//       throw new Error("Failed to create charge");
//     }
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: `Failed to create charge: ${errorMessage}` }, { status: 500 });
//   }
// }


// // app/api/join/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function POST(request: Request) {
//   try {
//     // 1. Authenticate the user and get their company ID
//     const user = await whopSdk.verifyUserToken(await headers());
//     const companyId = (user as { companyId?: string })?.companyId;

//     if (!user || !companyId) {
//       return NextResponse.json({ error: "Unauthorized or company not found." }, { status: 401 });
//     }

//     // 2. Fetch the custom entry fee for this specific company
//     const { data: companySettings } = await supabaseAdmin
//       .from("companies")
//       .select("entry_fee_cents")
//       .eq("id", companyId)
//       .single();

//     // Default to 200 cents ($2.00) if no price is set
//     const priceInCents = companySettings?.entry_fee_cents || 200;

//     // 3. Create the charge with the dynamic price
//     const chargeDetails = {
//       amount: priceInCents / 100, // Convert cents to dollars
//       currency: "usd" as const,
//       userId: user.userId,
//       // We associate the payment with both the tournament and the company
//       metadata: {
//         tournamentId: new Date().toISOString().split("T")[0],
//         companyId: companyId,
//       },
//     };

//     const charge = await whopSdk.payments.chargeUser(chargeDetails);

//     if (charge?.inAppPurchase) {
//       return NextResponse.json(charge.inAppPurchase);
//     } else {
//       throw new Error("Failed to create charge");
//     }
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: `Failed to create charge: ${errorMessage}` }, { status: 500 });
//   }
// }
