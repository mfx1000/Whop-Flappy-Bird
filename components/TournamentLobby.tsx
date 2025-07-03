// // components/TournamentLobby.tsx
// "use client"; // This is a Client Component

// import { useSearchParams } from "next/navigation";
// import JoinButton from "@/components/JoinButton";
// import Leaderboard from "@/components/Leaderboard";
// import Image from "next/image";

// export default function TournamentLobby() {
//   // useSearchParams is the correct hook for reading URL params in a Client Component
//   const searchParams = useSearchParams();
//   const isRetry = searchParams.get('retry') === 'true';

//   return (
//     <main className="flex flex-col items-center justify-center flex-grow w-full px-4 mt-8">
//         {/* Title */}
//         <div className="flex items-center justify-center gap-4 mb-6">
//             <Image src="/sprites/yellowbird-midflap.png" alt="Flappy Bird" width={68} height={48} className="w-10 h-auto md:w-12"/>
//             <h1 className="text-3xl md:text-5xl font-bold" style={{ WebkitTextStroke: '2px black' }}>
//                 Flappy Bird Royale
//             </h1>
//         </div>

//         {/* Instructions */}
//         <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg text-center border border-white/20 max-w-lg">
//             <h2 className="text-xl text-yellow-300 mb-2">Daily Tournament!</h2>
//             <p className="text-sm leading-relaxed">
//                 The player with the highest score at the end of the day wins 70% of the prize pool! Each attempt costs $1, and your best score is saved.
//             </p>
//             <div className="mt-4 pt-4 border-t border-white/20">
//                 <h3 className="text-lg text-yellow-300 mb-2">How to Play</h3>
//                 <p className="text-sm">Press <span className="font-bold text-white">SPACE</span> or <span className="font-bold text-white">TAP</span> the screen to flap.</p>
//             </div>
//         </div>
        
//         {/* Join/Retry Button */}
//         <div className="mt-6">
//             <JoinButton isRetry={isRetry} />
//         </div>
        
//         {/* Leaderboard */}
//         <div className="mt-6 w-full flex justify-center">
//             <Leaderboard />
//         </div>
//     </main>
//   );
// }


// components/TournamentLobby.tsx
"use client"; // This is a Client Component

import { useSearchParams } from "next/navigation";
import JoinButton from "@/components/JoinButton";
import Leaderboard from "@/components/Leaderboard";
import Image from "next/image";

export default function TournamentLobby() {
  // useSearchParams is the correct hook for reading URL params in a Client Component
  const searchParams = useSearchParams();
  const isRetry = searchParams.get('retry') === 'true';

  return (
    <main className="flex flex-col items-center justify-center flex-grow w-full px-4 mt-8">
        {/* Title */}
        <div className="flex items-center justify-center gap-4 mb-6">
            <Image src="/sprites/yellowbird-midflap.png" alt="Flappy Bird" width={68} height={48} className="w-10 h-auto md:w-12"/>
            <h1 className="text-3xl md:text-5xl font-bold" style={{ WebkitTextStroke: '2px black' }}>
                Flappy Bird Royale
            </h1>
        </div>

        {/* Instructions */}
        <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg text-center border border-white/20 max-w-lg">
            <h2 className="text-xl text-yellow-300 mb-2">Daily Tournament!</h2>
            <p className="text-sm leading-relaxed">
                The player with the highest score at the end of the day wins 70% of the prize pool! Each attempt costs $5, and your best score is saved.
            </p>
            <div className="mt-4 pt-4 border-t border-white/20">
                <h3 className="text-lg text-yellow-300 mb-2">How to Play</h3>
                <p className="text-sm">Press <span className="font-bold text-white">SPACE</span> or <span className="font-bold text-white">TAP</span> the screen to flap.</p>
            </div>
        </div>
        
        {/* Join/Retry Button */}
        <div className="mt-0">
            <JoinButton isRetry={isRetry} />
        </div>
        
        {/* Leaderboard */}
        <div className="w-full flex justify-center">
            <Leaderboard />
        </div>
    </main>
  );
}
