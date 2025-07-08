// app/api/company-settings/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET() {
  try {
    // 1. Authenticate the user and get their company ID
    const user = await whopSdk.verifyUserToken(await headers());
    const companyId = (user as { companyId?: string })?.companyId;

    if (!user || !companyId) {
      return NextResponse.json({ error: "This app must be opened within a Whop community." }, { status: 401 });
    }

    // 2. Check the user's access level for the company
    const access = await whopSdk.access.checkIfUserHasAccessToCompany({
        userId: user.userId,
        companyId: companyId,
    });
    const isAdmin = access?.accessLevel === 'admin';

    // 3. Fetch the company's settings from our database
    const { data: companySettings, error } = await supabaseAdmin
      .from("companies")
      .select("entry_fee_cents")
      .eq("id", companyId)
      .single();

    // FIX: Gracefully handle the case where no settings row is found for a new company
    if (error && error.code !== 'PGRST116') { // 'PGRST116' means "No rows found"
        throw error;
    }

    // 4. Return the user's role and the settings (which will be null if not found)
    return NextResponse.json({
        isAdmin,
        settings: companySettings, // This will be null for a new creator
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `Failed to fetch settings: ${errorMessage}` }, { status: 500 });
  }
}


// // app/api/company-settings/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// // Use the admin client to bypass RLS for this internal check
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function GET() {
//   try {
//     // 1. Authenticate the user and get their company ID
//     const user = await whopSdk.verifyUserToken(await headers());
//     const companyId = (user as { companyId?: string })?.companyId;

//     if (!user || !companyId) {
//       return NextResponse.json({ error: "Unauthorized or company not found." }, { status: 401 });
//     }

//     // 2. Check the user's access level for the company
//     const access = await whopSdk.access.checkIfUserHasAccessToCompany({
//         userId: user.userId,
//         companyId: companyId,
//     });
//     const isAdmin = access?.accessLevel === 'admin';

//     // 3. Fetch the company's settings from our database
//     const { data: companySettings, error } = await supabaseAdmin
//       .from("companies")
//       .select("entry_fee_cents")
//       .eq("id", companyId)
//       .single();

//     if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error
//         throw error;
//     }

//     // 4. Return the user's role and the company's settings
//     return NextResponse.json({
//         isAdmin,
//         settings: companySettings,
//     });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: `Failed to fetch settings: ${errorMessage}` }, { status: 500 });
//   }
// }
