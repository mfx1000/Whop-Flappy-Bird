// app/actions.ts
'use server';

import { WhopServerSdk } from "@whop/api"; // Import the main SDK constructor
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function setTournamentPrice(priceInCents: number, experienceId: string) {
  try {
    // 1. Authenticate the user making the request
    const user = await WhopServerSdk({ 
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
        appApiKey: process.env.WHOP_API_KEY! 
    }).verifyUserToken(await headers());

    if (!user || !user.userId) {
      throw new Error("Unauthorized.");
    }

    // 2. Create a new SDK instance scoped to THIS specific user
    const userScopedSdk = WhopServerSdk({
        appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
        appApiKey: process.env.WHOP_API_KEY!,
        onBehalfOfUserId: user.userId,
    });

    // 3. Use the user-scoped SDK to get the experience and its company
    const experience = await userScopedSdk.experiences.getExperience({ experienceId });
    const companyId = experience?.company?.id;

    if (!companyId) {
      throw new Error("Could not determine the company for this experience.");
    }

    // 4. Verify that this user is an admin of the company
    const access = await userScopedSdk.access.checkIfUserHasAccessToCompany({
        userId: user.userId,
        companyId: companyId,
    });

    if (access?.accessLevel !== 'admin') {
      throw new Error("You must be an admin to set the price.");
    }

    if (typeof priceInCents !== 'number' || priceInCents < 100) {
      throw new Error("Invalid price. Minimum is 100 cents ($1.00).");
    }

    // 5. Save the price to the database
    const { error } = await supabaseAdmin
      .from("companies")
      .upsert({ id: companyId, entry_fee_cents: priceInCents, price_last_set_at: new Date().toISOString() }, { onConflict: 'id' });

    if (error) throw error;

    revalidatePath(`/experience/${experienceId}`); 
    return { success: true, message: "Price set successfully." };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return { success: false, error: errorMessage };
  }
}

// The function now accepts experienceId to find the correct company
export async function getPayoutHistory(experienceId: string) {
    try {
        const user = await WhopServerSdk({ 
            appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
            appApiKey: process.env.WHOP_API_KEY!
        }).verifyUserToken(await headers());
        
        if (!user || !user.userId) throw new Error("Unauthorized.");

        const userScopedSdk = WhopServerSdk({
            appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
            appApiKey: process.env.WHOP_API_KEY!,
            onBehalfOfUserId: user.userId,
        });

        // Use the passed-in experienceId to find the company
        const experience = await userScopedSdk.experiences.getExperience({ experienceId });
        const companyId = experience?.company?.id;

        if (!companyId) throw new Error("Company not found.");

        // FIX: Corrected the typo from userScoped_sdk to userScopedSdk
        const access = await userScopedSdk.access.checkIfUserHasAccessToCompany({ userId: user.userId, companyId });
        if (access?.accessLevel !== 'admin') throw new Error("You must be an admin to view this data.");

        const { data: payouts, error } = await supabaseAdmin
            .from("payouts")
            .select("created_at, recipient_type, amount_cents")
            .eq("company_id", companyId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return { success: true, payouts };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return { success: false, error: errorMessage };
    }
}


// // app/actions.ts
// 'use server';

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// export async function setTournamentPrice(priceInCents: number, experienceId: string) {
//   try {
//     const user = await whopSdk.verifyUserToken(await headers());
//     if (!user) throw new Error("Unauthorized.");

//     const experience = await whopSdk.experiences.getExperience({ experienceId });
//     const companyId = experience?.company?.id;
//     if (!companyId) throw new Error("Could not determine the company for this experience.");

//     const access = await whopSdk.access.checkIfUserHasAccessToCompany({ userId: user.userId, companyId });
//     if (access?.accessLevel !== 'admin') throw new Error("You must be an admin to set the price.");

//     if (typeof priceInCents !== 'number' || priceInCents < 100) throw new Error("Invalid price. Minimum is 100 cents ($1.00).");

//     const { error } = await supabaseAdmin.from("companies").upsert({ id: companyId, entry_fee_cents: priceInCents, price_last_set_at: new Date().toISOString() }, { onConflict: 'id' });
//     if (error) throw error;

//     revalidatePath(`/experience/${experienceId}`); 
//     return { success: true, message: "Price set successfully." };
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return { success: false, error: errorMessage };
//   }
// }

// // --- NEW: Server Action to get payout history ---
// export async function getPayoutHistory() {
//     try {
//         const user = await whopSdk.verifyUserToken(await headers());
//         const companyId = (user as { companyId?: string })?.companyId;

//         if (!user || !companyId) {
//             throw new Error("Unauthorized or company not found.");
//         }

//         const access = await whopSdk.access.checkIfUserHasAccessToCompany({ userId: user.userId, companyId });
//         if (access?.accessLevel !== 'admin') {
//             throw new Error("You must be an admin to view this data.");
//         }

//         const { data: payouts, error } = await supabaseAdmin
//             .from("payouts")
//             .select("created_at, recipient_type, amount_cents")
//             .eq("company_id", companyId)
//             .order("created_at", { ascending: false });

//         if (error) throw error;

//         return { success: true, payouts };

//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//         return { success: false, error: errorMessage };
//     }
// }


// // app/actions.ts
// 'use server'; // This marks all functions in this file as Server Actions

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { revalidatePath } from "next/cache";

// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_KEY!
// );

// // This function runs on the server but can be called directly from client components.
// export async function setTournamentPrice(priceInCents: number, experienceId: string) {
//   try {
//     // Server Actions automatically have access to the request context, including headers.
//     const user = await whopSdk.verifyUserToken(await headers());
//     if (!user) {
//       throw new Error("Unauthorized.");
//     }

//     // Use the experienceId to reliably get the companyId
//     const experience = await whopSdk.experiences.getExperience({ experienceId });
//     const companyId = experience?.company?.id;

//     if (!companyId) {
//       throw new Error("Could not determine the company for this experience.");
//     }

//     // Check if the user is an admin of the company
//     const access = await whopSdk.access.checkIfUserHasAccessToCompany({
//         userId: user.userId,
//         companyId: companyId,
//     });

//     if (access?.accessLevel !== 'admin') {
//       throw new Error("You must be an admin to set the price.");
//     }

//     if (typeof priceInCents !== 'number' || priceInCents < 100) {
//       throw new Error("Invalid price. Minimum is 100 cents ($1.00).");
//     }

//     // Save the price to the database for this specific company
//     const { error } = await supabaseAdmin
//       .from("companies")
//       .upsert({ id: companyId, entry_fee_cents: priceInCents, price_last_set_at: new Date().toISOString() }, { onConflict: 'id' });

//     if (error) throw error;

//     // This tells Next.js to refresh the data for the home page on the next visit.
//     revalidatePath(`/experience/${experienceId}`); 
//     return { success: true, message: "Price set successfully." };

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return { success: false, error: errorMessage };
//   }
// }
