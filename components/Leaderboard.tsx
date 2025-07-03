// components/Leaderboard.tsx
"use client";

import { useEffect, useState } from "react";

type ScoreEntry = { username: string; score: number; avatar_url: string | null; };

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [prizePool, setPrizePool] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/leaderboard");
        if (!response.ok) throw new Error("Failed to fetch leaderboard data.");
        
        const data = await response.json();
        setScores(data.scores || []);
        setPrizePool(data.prizePool || 0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScores();
  }, []);

  if (isLoading) return <div className="text-white/80 mt-8 text-center font-pixel">Loading...</div>;
  if (error) return <div className="text-red-400 mt-8 text-center font-pixel">Error: {error}</div>;

  return (
    <div className="w-full max-w-md mt-10 bg-black/30 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/10">
      <h2 className="text-2xl font-bold text-yellow-300 text-center mb-2 font-pixel">LEADERBOARD</h2>
      <div className="text-center mb-6">
        <p className="text-white font-pixel">PRIZE POOL: <span className="text-green-400 font-bold">${prizePool.toFixed(2)}</span></p>
      </div>
      
      {scores.length === 0 ? (
        <div className="text-white/80 text-center font-pixel py-4">Be the first to set a score!</div>
      ) : (
        <ol className="space-y-3">
          {scores.map((entry, index) => (
            <li key={index} className="flex items-center justify-between bg-black/40 p-3 rounded-md">
              <div className="flex items-center">
                <span className="text-lg font-bold text-gray-400 w-8 font-pixel">{index + 1}.</span>
                <img 
                  src={entry.avatar_url || `https://placehold.co/40x40/1a1a1a/a3a3a3?text=${entry.username.charAt(0)}`} 
                  alt={entry.username}
                  className="w-10 h-10 rounded-full mr-4 border-2 border-gray-600"
                  onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/1a1a1a/a3a3a3?text=${entry.username.charAt(0)}`; }}
                />
                <span className="font-semibold text-white font-pixel text-sm">{entry.username}</span>
              </div>
              <span className="text-xl font-bold text-yellow-300 font-pixel">{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
