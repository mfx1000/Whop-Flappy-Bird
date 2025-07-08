// // app/api/admin/payout-history/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextRequest, NextResponse } from "next/server";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function GET(request: NextRequest) {
//   try {
//     // 1. Authenticate the user and get their company ID
//     const user = await whopSdk.verifyUserToken(await headers());
//     const companyId = (user as { companyId?: string })?.companyId;

//     if (!user || !companyId) {
//       return NextResponse.json({ error: "Unauthorized or company not found." }, { status: 401 });
//     }

//     // 2. Verify that the user is an admin of the company
//     const access = await whopSdk.access.checkIfUserHasAccessToCompany({
//         userId: user.userId,
//         companyId: companyId,
//     });

//     if (access?.accessLevel !== 'admin') {
//         return NextResponse.json({ error: "You must be an admin to view this data." }, { status: 403 });
//     }

//     // 3. Fetch all payout records for this specific company from the database
//     const { data: payouts, error } = await supabaseAdmin
//       .from("payouts")
//       .select("created_at, recipient_type, amount_cents")
//       .eq("company_id", companyId)
//       .order("created_at", { ascending: false }); // Show most recent first

//     if (error) throw error;

//     return NextResponse.json(payouts);

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: `Failed to fetch payout history: ${errorMessage}` }, { status: 500 });
//   }
// }
