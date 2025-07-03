// // app/page.tsx
// import JoinButton from "@/components/JoinButton";
// import Leaderboard from "@/components/Leaderboard";
// import Image from "next/image";
// import CountdownTimer from "@/components/CountdownTimer"; // Import the new component

// // The page is now a simple Server Component again
// export default function HomePage({
//   searchParams,
// }: {
//   searchParams: { [key: string]: string | string[] | undefined };
// }) {
//   const isRetry = searchParams?.['retry'] === 'true';

//   return (
//     <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center font-pixel text-white">
//       <div className="w-full h-full min-h-screen bg-black/30 flex flex-col items-center justify-between p-4">

//         {/* UPDATED: The header now uses the dynamic countdown timer */}
//         <header className="w-full max-w-lg text-center p-2 bg-black/50 rounded-b-lg border-b-2 border-l-2 border-r-2 border-yellow-300">
//             <CountdownTimer />
//         </header>

//         {/* Main Content Area */}
//         <main className="flex flex-col items-center justify-center flex-grow w-full px-4 mt-8">
//             {/* Title */}
//             <div className="flex items-center justify-center gap-4 mb-6">
//                 <Image src="/sprites/yellowbird-midflap.png" alt="Flappy Bird" width={68} height={48} className="w-10 h-auto md:w-12"/>
//                 <h1 className="text-3xl md:text-5xl font-bold" style={{ WebkitTextStroke: '2px black' }}>
//                     Flappy Bird Royale
//                 </h1>
//             </div>

//             {/* Instructions */}
//             <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg text-center border border-white/20 max-w-lg">
//                 <h2 className="text-xl text-yellow-300 mb-2">Daily Tournament!</h2>
//                 <p className="text-sm leading-relaxed">
//                     The player with the highest score at the end of the day wins 70% of the prize pool! Each attempt costs $5, and your best score is saved.
//                 </p>
//                 <div className="mt-4 pt-4 border-t border-white/20">
//                     <h3 className="text-lg text-yellow-300 mb-2">How to Play</h3>
//                     <p className="text-sm">Press <span className="font-bold text-white">SPACE</span> or <span className="font-bold text-white">TAP</span> the screen to flap.</p>
//                 </div>
//             </div>
            
//             {/* Join/Retry Button */}
//             <div className="mt-1">
//                 <JoinButton isRetry={isRetry} />
//             </div>
            
//             {/* Leaderboard */}
//             <div className="w-full flex justify-center">
//                 <Leaderboard />
//             </div>
//         </main>
        
//       </div>
//     </div>
//   );
// }


// // app/page.tsx
// import TournamentLobby from "@/components/TournamentLobby";
// import CountdownTimer from "@/components/CountdownTimer";

// // This page is now a simple, static Server Component.
// // It no longer needs to access searchParams.
// export default function HomePage() {
//   return (
//     <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center font-pixel text-white">
//       <div className="w-full h-full min-h-screen bg-black/30 flex flex-col items-center justify-between p-4">

//         {/* Header */}
//         <header className="w-full max-w-lg text-center p-2 bg-black/50 rounded-b-lg border-b-2 border-l-2 border-r-2 border-yellow-300">
//             <CountdownTimer />
//         </header>

//         {/* Render the new client component that handles all dynamic logic */}
//         <TournamentLobby />
        
//         {/* Footer Spacer */}
//         <footer className="w-full h-12"></footer>
//       </div>
//     </div>
//   );
// }

// app/page.tsx
import TournamentLobby from "@/components/TournamentLobby";
import CountdownTimer from "@/components/CountdownTimer";
import { Suspense } from 'react'; // Import Suspense

// A simple fallback component to show while the dynamic component loads.
// This will be displayed for a split second before the real lobby appears.
function LobbySkeleton() {
  return (
    <main className="flex flex-col items-center justify-center flex-grow w-full px-4 mt-8">
      <div className="text-white font-pixel text-lg">Loading Tournament...</div>
    </main>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center font-pixel text-white">
      <div className="w-full h-full min-h-screen bg-black/30 flex flex-col items-center justify-between p-4">

        {/* Header */}
        <header className="w-full max-w-lg text-center p-2 bg-black/50 rounded-b-lg border-b-2 border-l-2 border-r-2 border-yellow-300">
            <CountdownTimer />
        </header>

        {/* Wrap the client component in a Suspense boundary */}
        <Suspense fallback={<LobbySkeleton />}>
          <TournamentLobby />
        </Suspense>
        
        {/* Footer Spacer */}
        <footer className="w-full h-12"></footer>
      </div>
    </div>
  );
}
