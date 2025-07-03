// app/game/page.tsx
"use client";

import FlappyRoyaleGame from "@/components/FlappyRoyaleGame";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function GamePageClientWrapper() {
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // This effect runs once to verify the user is authenticated
  useEffect(() => {
    const verifyUser = async () => {
        try {
            const response = await fetch('/api/auth-check');
            const data = await response.json();
            if (data.userId) {
                setUserId(data.userId);
            } else {
                throw new Error(data.error || "Authentication failed.");
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
        }
    }
    verifyUser();
  }, []);

  // This is the function that gets passed to the game component
  const handleGameOver = () => {
    // When the game signals it's over, we redirect to the home page
    // and add '?retry=true' to the URL.
    router.push('/?retry=true'); 
  };

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-red-900 p-8 font-pixel text-center">
        <h1 className="text-2xl font-bold text-white">Unauthorized Access</h1>
        <p className="text-white/80 mt-2">{error}</p>
      </main>
    );
  }
  
  if (!userId) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-800 p-8">
            <p className="text-white font-pixel">Authenticating...</p>
        </main>
    )
  }

  // We render the game and pass it the `handleGameOver` function as a prop
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-800 p-8">
      <FlappyRoyaleGame userId={userId} onGameOver={handleGameOver} />
    </main>
  );
}
