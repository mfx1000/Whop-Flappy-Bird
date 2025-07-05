// // app/api/submit-score/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// // Initialize Supabase client
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// export async function POST(request: Request) {
//   try {
//     // 1. Authenticate the user
//     const user = await whopSdk.verifyUserToken(await headers());
//     if (!user) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // 2. Get the score from the request body
//     const { score } = await request.json();
//     if (typeof score !== 'number') {
//       return NextResponse.json({ error: "Invalid score" }, { status: 400 });
//     }

//     // 3. Generate the ID for today's tournament
//     const tournamentId = new Date().toISOString().split("T")[0];

//     // 4. Fetch the user's current Whop profile info
//     const userProfile = await whopSdk.users.getUser({ userId: user.userId });

//     // 5. Get the user's existing score for today's tournament, if any
//     const { data: existingScoreData, error: selectError } = await supabase
//       .from("scores")
//       .select("score")
//       .eq("user_id", user.userId)
//       .eq("tournament_id", tournamentId)
//       .single();

//     if (selectError && selectError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
//         throw selectError;
//     }

//     // 6. Only update if the new score is higher than the existing one
//     if (!existingScoreData || score > existingScoreData.score) {
//       const { error: upsertError } = await supabase.from("scores").upsert({
//         user_id: user.userId,
//         username: userProfile.username,
//         avatar_url: userProfile.profilePicture?.sourceUrl,
//         score: score,
//         tournament_id: tournamentId,
//       }, { onConflict: 'user_id,tournament_id' }); // Upsert handles insert/update automatically

//       if (upsertError) throw upsertError;

//       return NextResponse.json({ success: true, message: "New high score submitted!" });
//     }

//     return NextResponse.json({ success: true, message: "Score was not higher than previous best." });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     return NextResponse.json({ error: `Failed to submit score: ${errorMessage}` }, { status: 500 });
//   }
// }

// app/api/submit-score/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// const MAX_POSSIBLE_SCORE = 999;

// export async function POST(request: Request) {
//   try {
//     // 1. Authenticate the user
//     const user = await whopSdk.verifyUserToken(await headers());

//     if (!user || typeof user.userId !== 'string' || user.userId.length === 0) {
//       console.error("Submit Score Error: Unauthorized or invalid user token.", user);
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userId = user.userId;

//     // 2. Get the score from the request body
//     const { score } = await request.json();
//     if (typeof score !== 'number' || score < 0) {
//       console.error(`Submit Score Error: Invalid score format for user ${userId}. Score:`, score);
//       return NextResponse.json({ error: "Invalid score" }, { status: 400 });
//     }
    
//     // 3. Security Check: Reject impossibly high scores
//     if (score > MAX_POSSIBLE_SCORE) {
//         console.warn(`Cheat attempt detected for user ${userId}. Submitted score: ${score}`);
//         return NextResponse.json({ error: "Invalid score submitted." }, { status: 400 });
//     }

//     // 4. Generate the ID for today's tournament
//     const tournamentId = new Date().toISOString().split("T")[0];

//     // 5. Resiliently fetch user profile info
//     let username: string | undefined;
//     let avatar_url: string | undefined;
//     try {
//       const userProfile = await whopSdk.users.getUser({ userId: userId });
//       // FIX: Use nullish coalescing operator (??) to convert potential 'null' to 'undefined'.
//       username = userProfile?.username ?? undefined;
//       avatar_url = userProfile?.profilePicture?.sourceUrl ?? undefined;
//     } catch (profileError) {
//       console.warn(`Could not fetch Whop profile for user ${userId}. Proceeding without it.`, profileError);
//     }

//     // 6. Get the user's existing score for today's tournament
//     const { data: existingScoreData, error: selectError } = await supabase
//       .from("scores")
//       .select("score")
//       .eq("user_id", userId)
//       .eq("tournament_id", tournamentId)
//       .single();

//     if (selectError && selectError.code !== 'PGRST116') {
//       console.error("Submit Score Error: Failed to select existing score.", selectError);
//       throw selectError;
//     }

//     // 7. Only update if the new score is higher than the existing one
//     const existingScore = existingScoreData?.score || 0;
//     if (score > existingScore) {
//       const { error: upsertError } = await supabase.from("scores").upsert({
//         user_id: userId,
//         username: username,
//         avatar_url: avatar_url,
//         score: score,
//         tournament_id: tournamentId,
//       }, { onConflict: 'user_id,tournament_id' });

//       if (upsertError) {
//         console.error("Submit Score Error: Failed to upsert score.", upsertError);
//         throw upsertError;
//       }

//       console.log(`New high score for ${userId} (${username}): ${score}`);
//       return NextResponse.json({ success: true, message: "New high score submitted!" });
//     }

//     console.log(`Score for ${userId} (${score}) was not higher than best (${existingScore}).`);
//     return NextResponse.json({ success: true, message: "Score was not higher than previous best." });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     console.error("Submit Score Error: A critical error occurred.", errorMessage);
//     return NextResponse.json({ error: `Failed to submit score: ${errorMessage}` }, { status: 500 });
//   }
// }


// app/api/submit-score/route.ts

// import { whopSdk } from "@/lib/whop-sdk";
// import { createClient } from "@supabase/supabase-js";
// import { headers } from "next/headers";
// import { NextResponse } from "next/server";

// // This Supabase client is now used just for its structure, not for making requests directly.
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// const MAX_POSSIBLE_SCORE = 999;

// export async function POST(request: Request) {
//   try {
//     const requestHeaders = await headers();
//     // 1. Authenticate the user with Whop
//     const user = await whopSdk.verifyUserToken(requestHeaders);

//     if (!user || typeof user.userId !== 'string' || user.userId.length === 0) {
//       console.error("Submit Score Error: Unauthorized or invalid user token.", user);
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userId = user.userId;

//     // --- NEW: Authenticate the Supabase client for this specific request ---
//     // 2. Get the raw Whop JWT from the headers
//     const whopUserToken = requestHeaders.get('x-whop-user-token');
//     if (!whopUserToken) {
//         return NextResponse.json({ error: "Missing user token." }, { status: 401 });
//     }

//     // 3. Set the user's session for the Supabase client
//     // This tells Supabase who is making the request, so RLS policies will work.
//     const { error: sessionError } = await supabase.auth.setSession({
//         access_token: whopUserToken,
//         refresh_token: whopUserToken, // Can use the same token for both
//     });
//     if (sessionError) throw sessionError;
//     // --- END OF NEW AUTHENTICATION LOGIC ---


//     // 4. Get the score from the request body
//     const { score } = await request.json();
//     if (typeof score !== 'number' || score < 0) {
//       console.error(`Submit Score Error: Invalid score format for user ${userId}. Score:`, score);
//       return NextResponse.json({ error: "Invalid score" }, { status: 400 });
//     }
    
//     // 5. Security Check: Reject impossibly high scores
//     if (score > MAX_POSSIBLE_SCORE) {
//         console.warn(`Cheat attempt detected for user ${userId}. Submitted score: ${score}`);
//         return NextResponse.json({ error: "Invalid score submitted." }, { status: 400 });
//     }

//     // 6. Generate the ID for today's tournament
//     const tournamentId = new Date().toISOString().split("T")[0];

//     // 7. Resiliently fetch user profile info
//     let username: string | undefined;
//     let avatar_url: string | undefined;
//     try {
//       const userProfile = await whopSdk.users.getUser({ userId: userId });
//       username = userProfile?.username ?? undefined;
//       avatar_url = userProfile?.profilePicture?.sourceUrl ?? undefined;
//     } catch (profileError) {
//       console.warn(`Could not fetch Whop profile for user ${userId}. Proceeding without it.`, profileError);
//     }

//     // 8. Get the user's existing score for today's tournament
//     const { data: existingScoreData, error: selectError } = await supabase
//       .from("scores")
//       .select("score")
//       .eq("user_id", userId)
//       .eq("tournament_id", tournamentId)
//       .single();

//     if (selectError && selectError.code !== 'PGRST116') {
//       console.error("Submit Score Error: Failed to select existing score.", selectError);
//       throw selectError;
//     }

//     // 9. Only update if the new score is higher than the existing one
//     const existingScore = existingScoreData?.score || 0;
//     if (score > existingScore) {
//       const { error: upsertError } = await supabase.from("scores").upsert({
//         user_id: userId,
//         username: username,
//         avatar_url: avatar_url,
//         score: score,
//         tournament_id: tournamentId,
//       }, { onConflict: 'user_id,tournament_id' });

//       if (upsertError) {
//         console.error("Submit Score Error: Failed to upsert score.", upsertError);
//         throw upsertError;
//       }

//       console.log(`New high score for ${userId} (${username}): ${score}`);
//       return NextResponse.json({ success: true, message: "New high score submitted!" });
//     }

//     console.log(`Score for ${userId} (${score}) was not higher than best (${existingScore}).`);
//     return NextResponse.json({ success: true, message: "Score was not higher than previous best." });

//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
//     console.error("Submit Score Error: A critical error occurred.", errorMessage);
//     return NextResponse.json({ error: `Failed to submit score: ${errorMessage}` }, { status: 500 });
//   }
// }

// app/api/submit-score/route.ts

import { whopSdk } from "@/lib/whop-sdk";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// FIX: Create an admin client using the SERVICE_KEY.
// This client has the power to bypass RLS policies, which is safe
// because we verify the user's identity with Whop first.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const MAX_POSSIBLE_SCORE = 999;

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user with Whop. This is our security gate.
    const user = await whopSdk.verifyUserToken(await headers());
    if (!user || typeof user.userId !== 'string' || user.userId.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.userId;

    // REMOVED: The faulty setSession logic is gone.

    // 2. Get and validate the score
    const { score } = await request.json();
    if (typeof score !== 'number' || score < 0 || score > MAX_POSSIBLE_SCORE) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    // 3. Generate the tournament ID
    const tournamentId = new Date().toISOString().split("T")[0];

    // 4. Resiliently fetch user profile info
    let username: string | undefined;
    let avatar_url: string | undefined;
    try {
      const userProfile = await whopSdk.users.getUser({ userId: userId });
      username = userProfile?.username ?? undefined;
      avatar_url = userProfile?.profilePicture?.sourceUrl ?? undefined;
    } catch (profileError) {
      console.warn(`Could not fetch Whop profile for user ${userId}.`);
    }

    // 5. Get the user's existing score for today's tournament
    const { data: existingScoreData, error: selectError } = await supabaseAdmin
      .from("scores")
      .select("score")
      .eq("user_id", userId)
      .eq("tournament_id", tournamentId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') throw selectError;

    // 6. Only update if the new score is higher
    const existingScore = existingScoreData?.score || 0;
    if (score > existingScore) {
      const { error: upsertError } = await supabaseAdmin.from("scores").upsert({
        user_id: userId,
        username: username,
        avatar_url: avatar_url,
        score: score,
        tournament_id: tournamentId,
      }, { onConflict: 'user_id,tournament_id' });

      if (upsertError) throw upsertError;
      return NextResponse.json({ success: true, message: "New high score submitted!" });
    }

    return NextResponse.json({ success: true, message: "Score was not higher." });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Submit Score Error:", errorMessage);
    return NextResponse.json({ error: `Failed to submit score.` }, { status: 500 });
  }
}

