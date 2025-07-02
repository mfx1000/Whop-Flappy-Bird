// app/game/page.tsx

import { headers } from "next/headers";
import FlappyRoyaleGame from "@/components/FlappyRoyaleGame";
import { whopSdk } from "@/lib/whop-sdk";

// This is now an async Server Component
export default async function GamePage() {
  // FIX #1: Added 'await' to resolve the headers promise
  const headersList = await headers();
  
  // The whopSdk.verifyUserToken helper decodes the JWT from the headers
  const user = await whopSdk.verifyUserToken(headersList);

  // If the user is not authenticated, show an error.
  // This prevents anyone from accessing the game outside of your Whop app.
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-red-900 p-8">
        <h1 className="text-2xl font-bold text-white">Unauthorized Access</h1>
        <p className="text-white/80 mt-2">
          This game can only be played within a Whop App.
        </p>
      </main>
    );
  }

  // If the user is authenticated, render the game and pass the userId
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-800 p-8">
      {/* FIX #2: Changed user.id to the correct property, user.userId */}
      <FlappyRoyaleGame userId={user.userId} />
    </main>
  );
}