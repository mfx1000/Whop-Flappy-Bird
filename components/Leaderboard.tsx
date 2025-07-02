// components/Leaderboard.tsx
"use client";

import { useEffect, useState } from "react";

// Define a type for our score entries
type ScoreEntry = {
  username: string;
  score: number;
  avatar_url: string | null;
};

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data.");
        }
        const data = await response.json();
        setScores(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, []);

  if (isLoading) {
    return <div className="text-white/80 mt-8">Loading Leaderboard...</div>;
  }

  if (error) {
    return <div className="text-red-400 mt-8">Error: {error}</div>;
  }

  if (scores.length === 0) {
    return <div className="text-white/80 mt-8">No scores submitted yet for today's tournament. Be the first!</div>;
  }

  return (
    <div className="w-full max-w-md mt-10 bg-gray-900/50 p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold text-white text-center mb-6">Today's Leaderboard</h2>
      <ol className="space-y-4">
        {scores.map((entry, index) => (
          <li key={index} className="flex items-center justify-between bg-gray-800/60 p-3 rounded-md">
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-400 w-8">{index + 1}.</span>
              <img 
                src={entry.avatar_url || `https://placehold.co/40x40/27272a/a1a1aa?text=${entry.username.charAt(0)}`} 
                alt={entry.username}
                className="w-10 h-10 rounded-full mr-4"
                onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/27272a/a1a1aa?text=${entry.username.charAt(0)}`; }}
              />
              <span className="font-semibold text-white">{entry.username}</span>
            </div>
            <span className="text-xl font-bold text-green-400">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
