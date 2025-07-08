// // app/api/admin/set-price/route.ts

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
//     // 1. Authenticate the user
//     const user = await whopSdk.verifyUserToken(await headers());

//     // FIX: Cast the user object to include 'companyId' to resolve the TypeScript error.
//     // The companyId is present in the token payload when an app is opened in a company's context.
//     const companyId = (user as { companyId?: string })?.companyId;

//     if (!user || !companyId) {
//       return NextResponse.json({ error: "Unauthorized or company not found." }, { status: 401 });
//     }

//     // 2. Check if the user is an admin of the company
//     const access = await whopSdk.access.checkIfUserHasAccessToCompany({
//         userId: user.userId,
//         companyId: companyId, // Use the safely extracted companyId
//     });

//     if (access?.accessLevel !== 'admin') {
//         return NextResponse.json({ error: "You must be an admin to set the price." }, { status: 403 });
//     }

//     // 3. Get the price from the request body
//     const { priceInCents } = await request.json();
//     if (typeof priceInCents !== 'number' || priceInCents < 100) {
//       return NextResponse.json({ error: "Invalid price. Minimum is 100 cents ($1.00)." }, { status: 400 });
//     }

//     // 4. Save the price to the database for this specific company
//     const { error } = await supabaseAdmin
//       .from("companies")
//       .upsert({ id: companyId, entry_fee_cents: priceInCents }, { onConflict: 'id' });

//     if (error) throw error;

//     return NextResponse.json({ success: true, message: "Price set successfully." });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: `Failed to set price: ${errorMessage}` }, { status: 500 });
//   }
// }
