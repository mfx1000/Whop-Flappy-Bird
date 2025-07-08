// app/home-client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import CountdownTimer from "@/components/CountdownTimer";
import JoinButton from "@/components/JoinButton";
import Leaderboard from "@/components/Leaderboard";

// Define a type for our settings
interface CompanySettings {
    entry_fee_cents: number | null;
}

export default function HomePageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsContext, setNeedsContext] = useState(false);

    const isRetry = searchParams.get('retry') === 'true';

    useEffect(() => {
        const fetchSettingsAndRedirect = async () => {
            try {
                const response = await fetch('/api/company-settings');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch company settings.");
                }

                if (data.needsCompanyContext) {
                    setNeedsContext(true);
                    setIsLoading(false);
                    return;
                }

                if (data.isAdmin && !data.settings?.entry_fee_cents) {
                    router.push('/admin');
                    return;
                }
                
                setSettings(data.settings);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettingsAndRedirect();
    }, [router]);
    
    if (needsContext) {
        return (
            <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex items-center justify-center font-pixel text-white p-4">
                <div className="w-full max-w-lg bg-black/60 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
                    <h1 className="text-2xl text-yellow-300 mb-4">Almost there!</h1>
                    <p className="text-white/90">To finish setting up your app, please open it from within your community hub.</p>
                    <p className="text-xs text-gray-400 mt-4">(You are currently viewing this from the Developer Dashboard, which doesn't have a community context.)</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex items-center justify-center font-pixel text-white">
                Loading...
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex items-center justify-center font-pixel text-red-400 text-center p-4">
                <p>Error: {error}</p>
            </div>
        );
    }

    const entryFee = settings?.entry_fee_cents ? (settings.entry_fee_cents / 100).toFixed(2) : '2.00';

    return (
        <div className="w-full h-full min-h-screen bg-black/30 flex flex-col items-center justify-between p-4">
            <header className="w-full max-w-lg text-center p-2 bg-black/50 rounded-b-lg border-b-2 border-l-2 border-r-2 border-yellow-300">
                <CountdownTimer />
            </header>
            <main className="flex flex-col items-center justify-center flex-grow w-full px-4 mt-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                    <Image src="/sprites/yellowbird-midflap.png" alt="Flappy Bird" width={68} height={48} className="w-10 h-auto md:w-12"/>
                    <h1 className="text-3xl md:text-5xl font-bold" style={{ WebkitTextStroke: '2px black' }}>
                        Flappy Bird Royale
                    </h1>
                </div>
                <div className="bg-black/40 backdrop-blur-sm p-6 rounded-lg text-center border border-white/20 max-w-lg">
                    <h2 className="text-xl text-yellow-300 mb-2">Daily Tournament!</h2>
                    <p className="text-sm leading-relaxed">
                        The player with the highest score at the end of the day wins 70% of the prize pool! Each attempt costs ${entryFee}, and your best score is saved.
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <h3 className="text-lg text-yellow-300 mb-2">How to Play</h3>
                        <p className="text-sm">Press <span className="font-bold text-white">SPACE</span> or <span className="font-bold text-white">TAP</span> the screen to flap.</p>
                    </div>
                </div>
                <div className="mt-6">
                    <JoinButton isRetry={isRetry} entryFee={entryFee} />
                </div>
                <div className="mt-6 w-full flex justify-center">
                    <Leaderboard />
                </div>
            </main>
        </div>
    );
}
