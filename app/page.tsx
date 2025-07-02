// app/page.tsx
import JoinButton from "@/components/JoinButton";
import Leaderboard from "@/components/Leaderboard";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-800 p-8 pt-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white">Flappy Royale</h1>
        <p className="mt-2 text-lg text-gray-300">
          A new tournament starts every day!
        </p>
        
        <JoinButton />
      </div>

      {/* Add the Leaderboard component here */}
      <Leaderboard />
    </main>
  );
}
