// components/Leaderboard.tsx
"use client";

import { useEffect, useState } from "react";
import { getLeaderboardData } from "../app/actions"; // Import the Server Action
import { useParams } from "next/navigation"; // Import useParams

type ScoreEntry = {
  username: string;
  score: number;
  avatar_url: string | null;
};

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [prizePool, setPrizePool] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const experienceId = params.experienceId as string;

  useEffect(() => {
    if (!experienceId) return;

    const fetchScores = async () => {
      try {
        setIsLoading(true);
        // FIX: Call the Server Action directly
        const result = await getLeaderboardData(experienceId);

        if (result.success) {
          setScores(result.scores || []);
          setPrizePool(result.prizePool || 0);
        } else {
          throw new Error(result.error || "Failed to fetch leaderboard data.");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScores();
  }, [experienceId]);

  if (isLoading) {
    return <div className="text-white/80 mt-8 text-center font-pixel">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-400 mt-8 text-center font-pixel">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-md mt-10 bg-black/30 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/10">
      <div className="text-center text-xs text-white/80 mb-4 px-2">
        <p>The tournament winner receives 70% of the prize pool. 15% goes to the host & 15% to the app developer.</p>
      </div>

      <h2 className="text-2xl font-bold text-yellow-300 text-center mb-2 font-pixel">LEADERBOARD</h2>
      <div className="text-center mb-6">
        <p className="text-white font-pixel">
            PRIZE POOL: <span className="text-green-400 font-bold">${prizePool.toFixed(2)}</span>
        </p>
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


// // components/Leaderboard.tsx
// "use client";

// import { useEffect, useState } from "react";

// type ScoreEntry = {
//   username: string;
//   score: number;
//   avatar_url: string | null;
// };

// export default function Leaderboard() {
//   const [scores, setScores] = useState<ScoreEntry[]>([]);
//   const [prizePool, setPrizePool] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchScores = async () => {
//       try {
//         setIsLoading(true);
//         const response = await fetch("/api/leaderboard");
//         if (!response.ok) {
//           throw new Error("Failed to fetch leaderboard data.");
//         }
//         const data = await response.json();
//         setScores(data.scores || []);
//         setPrizePool(data.prizePool || 0);
//       } catch (err) {
//         const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//         setError(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchScores();
//   }, []);

//   if (isLoading) {
//     return <div className="text-white/80 mt-8 text-center font-pixel">Loading...</div>;
//   }

//   if (error) {
//     return <div className="text-red-400 mt-8 text-center font-pixel">Error: {error}</div>;
//   }

//   return (
//     <div className="w-full max-w-md mt-10 bg-black/30 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/10">
//       <h2 className="text-2xl font-bold text-yellow-300 text-center mb-2 font-pixel">LEADERBOARD</h2>
      
//       {/* UPDATED: Prize pool now has a hover-over tooltip */}
//       <div className="text-center mb-6">
//         <div className="relative inline-block group cursor-pointer">
//             <p className="text-white font-pixel">
//                 PRIZE POOL: <span className="text-green-400 font-bold">${prizePool.toFixed(2)}</span>
//             </p>
//             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
//                 <p className="font-bold text-yellow-300">Prize Pool Split:</p>
//                 <ul className="text-left mt-1">
//                     <li>- Winner: 70%</li>
//                     <li>- Host: 15%</li>
//                     <li>- Developer: 15%</li>
//                 </ul>
//             </div>
//         </div>
//       </div>
      
//       {scores.length === 0 ? (
//         <div className="text-white/80 text-center font-pixel py-4">Be the first to set a score!</div>
//       ) : (
//         <ol className="space-y-3">
//           {scores.map((entry, index) => (
//             <li key={index} className="flex items-center justify-between bg-black/40 p-3 rounded-md">
//               <div className="flex items-center">
//                 <span className="text-lg font-bold text-gray-400 w-8 font-pixel">{index + 1}.</span>
//                 <img 
//                   src={entry.avatar_url || `https://placehold.co/40x40/1a1a1a/a3a3a3?text=${entry.username.charAt(0)}`} 
//                   alt={entry.username}
//                   className="w-10 h-10 rounded-full mr-4 border-2 border-gray-600"
//                   onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/1a1a1a/a3a3a3?text=${entry.username.charAt(0)}`; }}
//                 />
//                 <span className="font-semibold text-white font-pixel text-sm">{entry.username}</span>
//               </div>
//               <span className="text-xl font-bold text-yellow-300 font-pixel">{entry.score}</span>
//             </li>
//           ))}
//         </ol>
//       )}
//     </div>
//   );
// }


// // components/Leaderboard.tsx
// "use client";

// import { useEffect, useState } from "react";

// type ScoreEntry = { username: string; score: number; avatar_url: string | null; };

// export default function Leaderboard() {
//   const [scores, setScores] = useState<ScoreEntry[]>([]);
//   const [prizePool, setPrizePool] = useState(0);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchScores = async () => {
//       try {
//         setIsLoading(true);
//         const response = await fetch("/api/leaderboard");
//         if (!response.ok) throw new Error("Failed to fetch leaderboard data.");
        
//         const data = await response.json();
//         setScores(data.scores || []);
//         setPrizePool(data.prizePool || 0);
//       } catch (err) {
//         const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//         setError(errorMessage);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchScores();
//   }, []);

//   if (isLoading) return <div className="text-white/80 mt-8 text-center font-pixel">Loading...</div>;
//   if (error) return <div className="text-red-400 mt-8 text-center font-pixel">Error: {error}</div>;

//   return (
//     <div className="w-full max-w-md mt-6 bg-black/30 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-white/10">
//       <h2 className="text-2xl font-bold text-yellow-300 text-center mb-2 font-pixel">LEADERBOARD</h2>
//       <div className="text-center mb-6">
//         <p className="text-white font-pixel">PRIZE POOL: <span className="text-green-400 font-bold">${prizePool.toFixed(2)}</span></p>
//       </div>
      
//       {scores.length === 0 ? (
//         <div className="text-white/80 text-center font-pixel py-4">Be the first to set a score!</div>
//       ) : (
//         <ol className="space-y-3">
//           {scores.map((entry, index) => (
//             <li key={index} className="flex items-center justify-between bg-black/40 p-3 rounded-md">
//               <div className="flex items-center">
//                 <span className="text-lg font-bold text-gray-400 w-8 font-pixel">{index + 1}.</span>
//                 <img 
//                   src={entry.avatar_url || `https://placehold.co/40x40/1a1a1a/a3a3a3?text=${entry.username.charAt(0)}`} 
//                   alt={entry.username}
//                   className="w-10 h-10 rounded-full mr-4 border-2 border-gray-600"
//                   onError={(e) => { e.currentTarget.src = `https://placehold.co/40x40/1a1a1a/a3a3a3?text=${entry.username.charAt(0)}`; }}
//                 />
//                 <span className="font-semibold text-white font-pixel text-sm">{entry.username}</span>
//               </div>
//               <span className="text-xl font-bold text-yellow-300 font-pixel">{entry.score}</span>
//             </li>
//           ))}
//         </ol>
//       )}
//     </div>
//   );
// }
