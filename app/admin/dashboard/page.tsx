// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Import all the necessary Server Actions
import { setTournamentPrice, getPayoutHistory, getCompanySettings } from '../../actions';
import Link from 'next/link';

// Define types for our data
interface CompanySettings {
    entry_fee_cents: number | null;
    price_last_set_at: string | null;
}

interface PayoutEntry {
    created_at: string;
    recipient_type: 'winner' | 'developer' | 'host';
    amount_cents: number;
}

// The main dashboard component
function AdminDashboard() {
    const [price, setPrice] = useState('2.00');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const experienceId = searchParams.get('experienceId');

	 // --- NEW: Time-based Price Lock Logic ---
    const [isPriceLocked, setIsPriceLocked] = useState(true);
    const [timeToNextUnlock, setTimeToNextUnlock] = useState('');

	 useEffect(() => {
        const checkPriceLock = () => {
            const nowUtc = new Date();
            
            // Calculate the time of the last reset (1:00 AM UTC today or yesterday)
            let lastResetTime = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 1, 0, 0, 0));
            if (nowUtc < lastResetTime) {
                lastResetTime.setUTCDate(lastResetTime.getUTCDate() - 1);
            }

            // The "unlock window" is the 5 minutes after the last reset
            const unlockWindowEndTime = new Date(lastResetTime.getTime() + 5 * 60 * 1000);

            // The price is editable only if we are currently within that 5-minute window.
            const isLocked = nowUtc > unlockWindowEndTime;
            setIsPriceLocked(isLocked);

            // Calculate time until the next unlock window starts
            const nextUnlockTime = new Date(lastResetTime);
            nextUnlockTime.setUTCDate(nextUnlockTime.getUTCDate() + 1);
            
            const diff = nextUnlockTime.getTime() - nowUtc.getTime();
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            setTimeToNextUnlock(`${hours}h ${minutes}m`);
        };

        checkPriceLock();
        const interval = setInterval(checkPriceLock, 60000); // Re-check every minute
        return () => clearInterval(interval);
    }, []);

	 useEffect(() => {
        const fetchData = async () => {
				if (!experienceId) {
                setError("Experience ID is missing. Please navigate from the main screen.");
                setIsLoading(false);
                return;
            }
            // if (!experienceId) return;
            setIsLoading(true);

				try {
                // FIX: Use Server Actions for all data fetching for security and reliability
                const [settingsResult, payoutResult] = await Promise.all([
                    getCompanySettings(experienceId),
                    getPayoutHistory(experienceId)
                ]);

                // Handle settings result
                if (settingsResult.success && settingsResult.settings) {
                    setSettings(settingsResult.settings);
                    if (settingsResult.settings.entry_fee_cents) {
                       setPrice((settingsResult.settings.entry_fee_cents / 100).toFixed(2));
                    }
                } else if (!settingsResult.success) {
                    throw new Error(settingsResult.error || "Failed to load company settings.");
                }

                // Handle payout history result
                if (payoutResult.success) {
                    setPayouts(payoutResult.payouts || []);
                } else {
                    throw new Error(payoutResult.error || "Failed to load payout history.");
                }

            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [experienceId]);

	 const handleSavePrice = async () => {
        if (!experienceId) {
            setError("Missing experience ID. Please go back and try again.");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const priceInCents = Math.round(parseFloat(price) * 100);
            if (isNaN(priceInCents) || priceInCents < 100) {
                throw new Error("Price must be at least $1.00.");
            }
            const result = await setTournamentPrice(priceInCents, experienceId);
            if (!result.success) {
                throw new Error(result.error || "Failed to save price.");
            }
            router.push(`/experience/${experienceId}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };
    
	 return (
        <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
            
				{/* UPDATED: Added link to go back to the main screen */}
            {experienceId && (
                <div className="text-left mb-6">
                    <Link href={`/experience/${experienceId}`} className="text-sm text-yellow-300 underline hover:text-yellow-200">
                        &larr; Back to Tournament
                    </Link>
                </div>
            )}
				
				<h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
            <p className="text-white/80 mb-6">Manage your tournament settings and view your earnings.</p>
            
            {/* Price Setting Section */}
            <fieldset disabled={isPriceLocked || isSaving} className="space-y-4 border-t border-white/10 pt-6">
                <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold">$</span>
                    <input type="number" step="0.01" min="1.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50" />
                </div>
                
                {/* UPDATED: New UI text for the price lock */}
                {isPriceLocked ? (
                    <p className="text-xs text-orange-400 mt-2">
                        Price is locked. You can change it for the next tournament in {timeToNextUnlock}.
                    </p>
                ) : (
                    <p className="text-xs text-green-400 mt-2">
                        The price is now unlocked for the next 5 minutes.
                    </p>
                )}

                <button onClick={handleSavePrice} disabled={isSaving || isPriceLocked} className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600">
                    {isSaving ? "Saving..." : "Update Price"}
                </button>
            </fieldset>

				{/* --- NEW: Payout Split Information --- */}
            <div className="mt-6 text-xs text-gray-300">
                <p>The prize pool is split: 70% to the winner, 15% will go to the app creator and 15% will go to the whop owner.</p>
            </div>

            {/* Payout History Section */}
            <div className="mt-10 border-t border-white/10 pt-6">
                <h2 className="text-xl text-white font-semibold mb-4">Your Payout History</h2>
                {isLoading ? <p>Loading history...</p> : (
                    <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2">
                        {payouts.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-yellow-300 uppercase">
                                    <tr>
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Your Share</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.filter(p => p.recipient_type === 'host').map((payout, index) => (
                                        <tr key={index} className="border-b border-gray-700">
                                            <td className="p-2">{new Date(payout.created_at).toLocaleDateString()}</td>
                                            <td className="p-2 text-green-400 font-bold">${(payout.amount_cents / 100).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-400 p-4">No payouts have been processed yet.</p>
                        )}
                    </div>
                )}
            </div>

            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
    );
}

// The page itself just provides the Suspense boundary
export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
            <Suspense fallback={<div>Loading Dashboard...</div>}>
                <AdminDashboard />
            </Suspense>
        </div>
    );
}

// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// // Import all the necessary Server Actions
// import { setTournamentPrice, getPayoutHistory, getCompanySettings } from '../../actions';
// import Link from 'next/link';

// // Define types for our data
// interface CompanySettings {
//     entry_fee_cents: number | null;
//     price_last_set_at: string | null;
// }

// interface PayoutEntry {
//     created_at: string;
//     recipient_type: 'winner' | 'developer' | 'host';
//     amount_cents: number;
// }

// // The main dashboard component
// function AdminDashboard() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [settings, setSettings] = useState<CompanySettings | null>(null);
//     const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

//     // Calculate if the price is currently locked
//     const lastSetDate = settings?.price_last_set_at ? new Date(settings.price_last_set_at) : null;
//     const isPriceLocked = lastSetDate ? (new Date().getTime() - lastSetDate.getTime()) < 24 * 60 * 60 * 1000 : false;
//     const canChangeDate = lastSetDate ? new Date(lastSetDate.getTime() + 24 * 60 * 60 * 1000) : null;

//     useEffect(() => {
//         const fetchData = async () => {
//             if (!experienceId) {
//                 setError("Experience ID is missing. Please navigate from the main screen.");
//                 setIsLoading(false);
//                 return;
//             }
//             setIsLoading(true);
//             try {
//                 // FIX: Use Server Actions for all data fetching for security and reliability
//                 const [settingsResult, payoutResult] = await Promise.all([
//                     getCompanySettings(experienceId),
//                     getPayoutHistory(experienceId)
//                 ]);

//                 // Handle settings result
//                 if (settingsResult.success && settingsResult.settings) {
//                     setSettings(settingsResult.settings);
//                     if (settingsResult.settings.entry_fee_cents) {
//                        setPrice((settingsResult.settings.entry_fee_cents / 100).toFixed(2));
//                     }
//                 } else if (!settingsResult.success) {
//                     throw new Error(settingsResult.error || "Failed to load company settings.");
//                 }

//                 // Handle payout history result
//                 if (payoutResult.success) {
//                     setPayouts(payoutResult.payouts || []);
//                 } else {
//                     throw new Error(payoutResult.error || "Failed to load payout history.");
//                 }

//             } catch (e) {
//                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
//                 setError(errorMessage);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, [experienceId]);

//     const handleSavePrice = async () => {
//         if (!experienceId) {
//             setError("Missing experience ID. Please go back and try again.");
//             return;
//         }
//         setIsSaving(true);
//         setError(null);
//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }
//             const result = await setTournamentPrice(priceInCents, experienceId);
//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }
//             router.push(`/experience/${experienceId}`);
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsSaving(false);
//         }
//     };
    
//     // Main UI Render
//     if (isLoading) {
//         return <p className="text-white animate-pulse">Loading Dashboard...</p>;
//     }

//     if (error) {
//         return <p className="text-red-400">{error}</p>;
//     }

//     return (
//         <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             {experienceId && (
//                 <div className="text-left mb-6">
//                     <Link href={`/experience/${experienceId}`} className="text-sm text-yellow-300 underline hover:text-yellow-200">
//                         &larr; Back to Tournament
//                     </Link>
//                 </div>
//             )}
//             <h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
//             <p className="text-white/80 mb-6">Manage your tournament settings and view your earnings.</p>
            
//             <fieldset disabled={isPriceLocked || isSaving} className="space-y-4 border-t border-white/10 pt-6">
//                 <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input type="number" step="0.01" min="1.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50" />
//                 </div>
//                 {isPriceLocked && canChangeDate && (<p className="text-xs text-orange-400 mt-2">Price is locked. You can change it again after {canChangeDate.toLocaleString()}.</p>)}
//                 <button onClick={handleSavePrice} disabled={isSaving || isPriceLocked} className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600">
//                     {isSaving ? "Saving..." : "Update Price"}
//                 </button>
//             </fieldset>

//             <div className="mt-6 text-xs text-gray-300">
//                 <p>Payouts are processed daily. The prize pool is split: 70% to the winner, 15% to you (the host), and 15% to the app developer.</p>
//             </div>

//             <div className="mt-10 border-t border-white/10 pt-6">
//                 <h2 className="text-xl text-white font-semibold mb-4">Your Payout History</h2>
//                 <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2">
//                     {payouts.length > 0 ? (
//                         <table className="w-full text-left text-sm">
//                             <thead className="text-xs text-yellow-300 uppercase">
//                                 <tr><th className="p-2">Date</th><th className="p-2">Your Share</th></tr>
//                             </thead>
//                             <tbody>
//                                 {payouts.filter(p => p.recipient_type === 'host').map((payout, index) => (
//                                     <tr key={payout.created_at + index} className="border-b border-gray-700">
//                                         <td className="p-2">{new Date(payout.created_at).toLocaleDateString()}</td>
//                                         <td className="p-2 text-green-400 font-bold">${(payout.amount_cents / 100).toFixed(2)}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     ) : (
//                         <p className="text-gray-400 p-4">No payouts have been processed yet.</p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminDashboardPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading Dashboard...</div>}>
//                 <AdminDashboard />
//             </Suspense>
//         </div>
//     );
// }



// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice, getPayoutHistory, getCompanySettings } from '../../actions';
// import Link from 'next/link'; // Import the Link component

// // Define types for our data
// interface CompanySettings {
//     entry_fee_cents: number | null;
//     price_last_set_at: string | null;
// }

// interface PayoutEntry {
//     created_at: string;
//     recipient_type: 'winner' | 'developer' | 'host';
//     amount_cents: number;
// }

// // The main dashboard component is wrapped in Suspense so it can use searchParams
// function AdminDashboard() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);
// 	 const [settings, setSettings] = useState<CompanySettings | null>(null);
//     const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

//     // --- NEW: Time-based Price Lock Logic ---
//     const [isPriceLocked, setIsPriceLocked] = useState(true);
//     const [timeToNextUnlock, setTimeToNextUnlock] = useState('');

//     useEffect(() => {
//         const checkPriceLock = () => {
//             const nowUtc = new Date();
            
//             // Calculate the time of the last reset (1:00 AM UTC today or yesterday)
//             let lastResetTime = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 1, 0, 0, 0));
//             if (nowUtc < lastResetTime) {
//                 lastResetTime.setUTCDate(lastResetTime.getUTCDate() - 1);
//             }

//             // The "unlock window" is the 5 minutes after the last reset
//             const unlockWindowEndTime = new Date(lastResetTime.getTime() + 5 * 60 * 1000);

//             // The price is editable only if we are currently within that 5-minute window.
//             const isLocked = nowUtc > unlockWindowEndTime;
//             setIsPriceLocked(isLocked);

//             // Calculate time until the next unlock window starts
//             const nextUnlockTime = new Date(lastResetTime);
//             nextUnlockTime.setUTCDate(nextUnlockTime.getUTCDate() + 1);
            
//             const diff = nextUnlockTime.getTime() - nowUtc.getTime();
//             const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//             const minutes = Math.floor((diff / 1000 / 60) % 60);
//             setTimeToNextUnlock(`${hours}h ${minutes}m`);
//         };

//         checkPriceLock();
//         const interval = setInterval(checkPriceLock, 60000); // Re-check every minute
//         return () => clearInterval(interval);
//     }, []);


//     useEffect(() => {
//         const fetchData = async () => {
//             if (!experienceId) return;
//             setIsLoading(true);
//             try {
//                 // Fetch settings using the API route
//                 const settingsResponse = await fetch(`/api/company-settings?experienceId=${experienceId}`);
//                 const settingsData = await settingsResponse.json();
//                 if (settingsData.settings && settingsData.settings.entry_fee_cents) {
//                     setPrice((settingsData.settings.entry_fee_cents / 100).toFixed(2));
//                 }

//                 // Fetch payout history using the Server Action
//                 const payoutResult = await getPayoutHistory(experienceId);
//                 if (payoutResult.success) {
//                     setPayouts(payoutResult.payouts || []);
//                 } else {
//                     throw new Error(payoutResult.error);
//                 }

//             } catch (e) {
//                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
//                 setError(errorMessage);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, [experienceId]);

//     const handleSavePrice = async () => {
//         if (!experienceId) {
//             setError("Missing experience ID. Please go back and try again.");
//             return;
//         }
//         setIsSaving(true);
//         setError(null);
//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }
//             const result = await setTournamentPrice(priceInCents, experienceId);
//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }
//             // On success, redirect to the main lobby to see the changes
//             router.push(`/experience/${experienceId}`);
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
            
// 				{/* UPDATED: Added link to go back to the main screen */}
//             {experienceId && (
//                 <div className="text-left mb-6">
//                     <Link href={`/experience/${experienceId}`} className="text-sm text-yellow-300 underline hover:text-yellow-200">
//                         &larr; Back to Tournament
//                     </Link>
//                 </div>
//             )}
				
// 				<h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
//             <p className="text-white/80 mb-6">Manage your tournament settings and view your earnings.</p>
            
//             {/* Price Setting Section */}
//             <fieldset disabled={isPriceLocked || isSaving} className="space-y-4 border-t border-white/10 pt-6">
//                 <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input type="number" step="0.01" min="1.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50" />
//                 </div>
                
//                 {/* UPDATED: New UI text for the price lock */}
//                 {isPriceLocked ? (
//                     <p className="text-xs text-orange-400 mt-2">
//                         Price is locked. You can change it for the next tournament in {timeToNextUnlock}.
//                     </p>
//                 ) : (
//                     <p className="text-xs text-green-400 mt-2">
//                         The price is now unlocked for the next 5 minutes.
//                     </p>
//                 )}

//                 <button onClick={handleSavePrice} disabled={isSaving || isPriceLocked} className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600">
//                     {isSaving ? "Saving..." : "Update Price"}
//                 </button>
//             </fieldset>

// 				{/* --- NEW: Payout Split Information --- */}
//             <div className="mt-6 text-xs text-gray-300">
//                 <p>The prize pool is split: 70% to the winner, 15% will go to the app creator and 15% will go to the whop owner.</p>
//             </div>

//             {/* Payout History Section */}
//             <div className="mt-10 border-t border-white/10 pt-6">
//                 <h2 className="text-xl text-white font-semibold mb-4">Your Payout History</h2>
//                 {isLoading ? <p>Loading history...</p> : (
//                     <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2">
//                         {payouts.length > 0 ? (
//                             <table className="w-full text-left text-sm">
//                                 <thead className="text-xs text-yellow-300 uppercase">
//                                     <tr>
//                                         <th className="p-2">Date</th>
//                                         <th className="p-2">Your Share</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {payouts.filter(p => p.recipient_type === 'host').map((payout, index) => (
//                                         <tr key={index} className="border-b border-gray-700">
//                                             <td className="p-2">{new Date(payout.created_at).toLocaleDateString()}</td>
//                                             <td className="p-2 text-green-400 font-bold">${(payout.amount_cents / 100).toFixed(2)}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         ) : (
//                             <p className="text-gray-400 p-4">No payouts have been processed yet.</p>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminDashboardPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading Dashboard...</div>}>
//                 <AdminDashboard />
//             </Suspense>
//         </div>
//     );
// }

// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice, getPayoutHistory } from '../../actions';
// import Link from 'next/link';

// // Define types for our data
// interface CompanySettings {
//     entry_fee_cents: number | null;
//     price_last_set_at: string | null;
// }

// interface PayoutEntry {
//     created_at: string;
//     recipient_type: 'winner' | 'developer' | 'host';
//     amount_cents: number;
// }

// // The main dashboard component is wrapped in Suspense so it can use searchParams
// function AdminDashboard() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [settings, setSettings] = useState<CompanySettings | null>(null);
//     const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

//     // Calculate if the price is currently locked
//     const lastSetDate = settings?.price_last_set_at ? new Date(settings.price_last_set_at) : null;
//     const isPriceLocked = lastSetDate ? (new Date().getTime() - lastSetDate.getTime()) < 24 * 60 * 60 * 1000 : false;
//     const canChangeDate = lastSetDate ? new Date(lastSetDate.getTime() + 24 * 60 * 60 * 1000) : null;

//     useEffect(() => {
//         const fetchData = async () => {
//             if (!experienceId) return;
//             setIsLoading(true);
//             try {
//                 // Fetch settings using the API route
//                 const settingsResponse = await fetch(`/api/company-settings?experienceId=${experienceId}`);
//                 const settingsData = await settingsResponse.json();
//                 if (settingsData.settings) {
//                     setSettings(settingsData.settings);
//                     if (settingsData.settings.entry_fee_cents) {
//                        setPrice((settingsData.settings.entry_fee_cents / 100).toFixed(2));
//                     }
//                 }

//                 // Fetch payout history using the Server Action
//                 const payoutResult = await getPayoutHistory(experienceId);
//                 if (payoutResult.success) {
//                     setPayouts(payoutResult.payouts || []);
//                 } else {
//                     throw new Error(payoutResult.error);
//                 }

//             } catch (e) {
//                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
//                 setError(errorMessage);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, [experienceId]);

//     const handleSavePrice = async () => {
//         if (!experienceId) {
//             setError("Missing experience ID. Please go back and try again.");
//             return;
//         }
//         setIsSaving(true);
//         setError(null);
//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }
//             const result = await setTournamentPrice(priceInCents, experienceId);
//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }
//             // On success, redirect to the main lobby to see the changes
//             router.push(`/experience/${experienceId}`);
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             {experienceId && (
//                 <div className="text-left mb-6">
//                     <Link href={`/experience/${experienceId}`} className="text-sm text-yellow-300 underline hover:text-yellow-200">
//                         &larr; Back to Tournament
//                     </Link>
//                 </div>
//             )}
//             <h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
//             <p className="text-white/80 mb-6">Manage your tournament settings and view your earnings.</p>
            
//             {/* Price Setting Section */}
//             <fieldset disabled={isPriceLocked || isSaving} className="space-y-4 border-t border-white/10 pt-6">
//                 <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input type="number" step="0.01" min="1.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50" />
//                 </div>
//                 {isPriceLocked && canChangeDate && (<p className="text-xs text-orange-400 mt-2">Price is locked. You can change it again in {canChangeDate.toLocaleString()}.</p>)}
//                 <button onClick={handleSavePrice} disabled={isSaving || isPriceLocked} className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600">
//                     {isSaving ? "Saving..." : "Update Price"}
//                 </button>
//             </fieldset>

				// {/* --- NEW: Payout Split Information --- */}
            // <div className="mt-6 text-xs text-gray-300">
            //     <p>The prize pool is split: 70% to the winner, 15% will go to the app creator and 15% will go to the whop owner.</p>
            // </div>


//             {/* Payout History Section */}
//             <div className="mt-10 border-t border-white/10 pt-6">
//                 <h2 className="text-xl text-white font-semibold mb-4">Your Payout History</h2>
//                 {isLoading ? <p>Loading history...</p> : (
//                     <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2">
//                         {payouts.length > 0 ? (
//                             <table className="w-full text-left text-sm">
//                                 <thead className="text-xs text-yellow-300 uppercase">
//                                     <tr>
//                                         <th className="p-2">Date</th>
//                                         <th className="p-2">Your Share</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {payouts.filter(p => p.recipient_type === 'host').map((payout, index) => (
//                                         <tr key={payout.created_at + index} className="border-b border-gray-700">
//                                             <td className="p-2">{new Date(payout.created_at).toLocaleDateString()}</td>
//                                             <td className="p-2 text-green-400 font-bold">${(payout.amount_cents / 100).toFixed(2)}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         ) : (
//                             <p className="text-gray-400 p-4">No payouts have been processed yet.</p>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminDashboardPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading Dashboard...</div>}>
//                 <AdminDashboard />
//             </Suspense>
//         </div>
//     );
// }




// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice, getPayoutHistory } from '../../actions';

// // Define types for our data
// interface CompanySettings {
//     entry_fee_cents: number | null;
//     price_last_set_at: string | null;
// }

// interface PayoutEntry {
//     created_at: string;
//     recipient_type: 'winner' | 'developer' | 'host';
//     amount_cents: number;
// }

// // The main dashboard component is wrapped in Suspense so it can use searchParams
// function AdminDashboard() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [settings, setSettings] = useState<CompanySettings | null>(null);
//     const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

//     // Calculate if the price is currently locked
//     const lastSetDate = settings?.price_last_set_at ? new Date(settings.price_last_set_at) : null;
//     const isPriceLocked = lastSetDate ? (new Date().getTime() - lastSetDate.getTime()) < 24 * 60 * 60 * 1000 : false;
//     const canChangeDate = lastSetDate ? new Date(lastSetDate.getTime() + 24 * 60 * 60 * 1000) : null;

//     useEffect(() => {
//         const fetchData = async () => {
//             if (!experienceId) return;
//             setIsLoading(true);
//             try {
//                 // Fetch settings using the API route
//                 const settingsResponse = await fetch(`/api/company-settings?experienceId=${experienceId}`);
//                 const settingsData = await settingsResponse.json();
//                 if (settingsData.settings) {
//                     setSettings(settingsData.settings);
//                     if (settingsData.settings.entry_fee_cents) {
//                        setPrice((settingsData.settings.entry_fee_cents / 100).toFixed(2));
//                     }
//                 }

//                 // Fetch payout history using the Server Action
//                 const payoutResult = await getPayoutHistory(experienceId);
//                 if (payoutResult.success) {
//                     setPayouts(payoutResult.payouts || []);
//                 } else {
//                     throw new Error(payoutResult.error);
//                 }

//             } catch (e) {
//                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
//                 setError(errorMessage);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, [experienceId]);

//     const handleSavePrice = async () => {
//         if (!experienceId) {
//             setError("Missing experience ID. Please go back and try again.");
//             return;
//         }
//         setIsSaving(true);
//         setError(null);
//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }
//             const result = await setTournamentPrice(priceInCents, experienceId);
//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }
//             // On success, redirect to the main lobby to see the changes
//             router.push(`/experience/${experienceId}`);
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             <h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
//             <p className="text-white/80 mb-6">Manage your tournament settings and view your earnings.</p>
            
//             {/* Price Setting Section */}
//             <fieldset disabled={isPriceLocked || isSaving} className="space-y-4 border-t border-white/10 pt-6">
//                 <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input type="number" step="0.01" min="1.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50" />
//                 </div>
//                 {isPriceLocked && canChangeDate && (<p className="text-xs text-orange-400 mt-2">Price is locked. You can change it again after {canChangeDate.toLocaleString()}.</p>)}
//                 <button onClick={handleSavePrice} disabled={isSaving || isPriceLocked} className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600">
//                     {isSaving ? "Saving..." : "Update Price"}
//                 </button>
//             </fieldset>

//             {/* Payout History Section */}
//             <div className="mt-10 border-t border-white/10 pt-6">
//                 <h2 className="text-xl text-white font-semibold mb-4">Your Payout History</h2>
//                 {isLoading ? <p>Loading history...</p> : (
//                     <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2">
//                         {payouts.length > 0 ? (
//                             <table className="w-full text-left text-sm">
//                                 <thead className="text-xs text-yellow-300 uppercase">
//                                     <tr>
//                                         <th className="p-2">Date</th>
//                                         <th className="p-2">Your Share</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {payouts.filter(p => p.recipient_type === 'host').map((payout, index) => (
//                                         <tr key={index} className="border-b border-gray-700">
//                                             <td className="p-2">{new Date(payout.created_at).toLocaleDateString()}</td>
//                                             <td className="p-2 text-green-400 font-bold">${(payout.amount_cents / 100).toFixed(2)}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         ) : (
//                             <p className="text-gray-400 p-4">No payouts have been processed yet.</p>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminDashboardPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading Dashboard...</div>}>
//                 <AdminDashboard />
//             </Suspense>
//         </div>
//     );
// }


// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect, Suspense, useTransition } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice, getPayoutHistory } from '../../actions';

// // Define types for our data
// interface CompanySettings {
//     entry_fee_cents: number | null;
//     price_last_set_at: string | null;
// }

// interface PayoutEntry {
//     created_at: string;
//     recipient_type: 'winner' | 'developer' | 'host';
//     amount_cents: number;
// }

// // The main dashboard component
// function AdminDashboard() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [settings, setSettings] = useState<CompanySettings | null>(null);
//     const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

//     // Calculate if the price is currently locked
//     const lastSetDate = settings?.price_last_set_at ? new Date(settings.price_last_set_at) : null;
//     const isPriceLocked = lastSetDate ? (new Date().getTime() - lastSetDate.getTime()) < 24 * 60 * 60 * 1000 : false;
//     const canChangeDate = lastSetDate ? new Date(lastSetDate.getTime() + 24 * 60 * 60 * 1000) : null;

//     useEffect(() => {
//         const fetchData = async () => {
//             if (!experienceId) return;
//             setIsLoading(true);
//             try {
//                 // Fetch settings using the API route
//                 const settingsResponse = await fetch(`/api/company-settings?experienceId=${experienceId}`);
//                 const settingsData = await settingsResponse.json();
//                 if (settingsData.settings) {
//                     setSettings(settingsData.settings);
//                     if (settingsData.settings.entry_fee_cents) {
//                        setPrice((settingsData.settings.entry_fee_cents / 100).toFixed(2));
//                     }
//                 }

//                 // Fetch payout history using the Server Action
//                 const payoutResult = await getPayoutHistory();
//                 if (payoutResult.success) {
//                     setPayouts(payoutResult.payouts || []);
//                 } else {
//                     throw new Error(payoutResult.error);
//                 }

//             } catch (e) {
//                 const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
//                 setError(errorMessage);
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchData();
//     }, [experienceId]);

//     const handleSavePrice = async () => {
//         if (!experienceId) {
//             setError("Missing experience ID. Please go back and try again.");
//             return;
//         }
//         setIsSaving(true);
//         setError(null);
//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }
//             const result = await setTournamentPrice(priceInCents, experienceId);
//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }
//             // On success, redirect to the main lobby to see the changes
//             router.push(`/experience/${experienceId}`);
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-2xl bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             <h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
//             <p className="text-white/80 mb-6">Manage your tournament settings and view your earnings.</p>
            
//             {/* Price Setting Section */}
//             <fieldset disabled={isPriceLocked || isSaving} className="space-y-4 border-t border-white/10 pt-6">
//                 <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input type="number" step="0.01" min="1.00" value={price} onChange={(e) => setPrice(e.target.value)} className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50" />
//                 </div>
//                 {isPriceLocked && canChangeDate && (<p className="text-xs text-orange-400 mt-2">Price is locked. You can change it again after {canChangeDate.toLocaleString()}.</p>)}
//                 <button onClick={handleSavePrice} disabled={isSaving || isPriceLocked} className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600">
//                     {isSaving ? "Saving..." : "Update Price"}
//                 </button>
//             </fieldset>

//             {/* Payout History Section */}
//             <div className="mt-10 border-t border-white/10 pt-6">
//                 <h2 className="text-xl text-white font-semibold mb-4">Your Payout History</h2>
//                 {isLoading ? <p>Loading history...</p> : (
//                     <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2">
//                         {payouts.length > 0 ? (
//                             <table className="w-full text-left text-sm">
//                                 <thead className="text-xs text-yellow-300 uppercase">
//                                     <tr>
//                                         <th className="p-2">Date</th>
//                                         <th className="p-2">Your Share</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {payouts.filter(p => p.recipient_type === 'host').map((payout, index) => (
//                                         <tr key={index} className="border-b border-gray-700">
//                                             <td className="p-2">{new Date(payout.created_at).toLocaleDateString()}</td>
//                                             <td className="p-2 text-green-400 font-bold">${(payout.amount_cents / 100).toFixed(2)}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         ) : (
//                             <p className="text-gray-400 p-4">No payouts have been processed yet.</p>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminDashboardPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading Dashboard...</div>}>
//                 <AdminDashboard />
//             </Suspense>
//         </div>
//     );
// }



// // app/admin/dashboard/page.tsx
// "use client";

// import { useState, useEffect, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice } from '../../actions';

// // Define a type for our settings
// interface CompanySettings {
//     entry_fee_cents: number | null;
//     price_last_set_at: string | null;
// }

// // The main form component is wrapped in Suspense so it can use searchParams
// function AdminDashboard() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [settings, setSettings] = useState<CompanySettings | null>(null);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

//     // Calculate if the price is currently locked
//     const lastSetDate = settings?.price_last_set_at ? new Date(settings.price_last_set_at) : null;
//     const isPriceLocked = lastSetDate ? (new Date().getTime() - lastSetDate.getTime()) < 24 * 60 * 60 * 1000 : false;
    
//     const canChangeDate = lastSetDate ? new Date(lastSetDate.getTime() + 24 * 60 * 60 * 1000) : null;

//     useEffect(() => {
//         // Fetch current settings when the component mounts
//         const fetchSettings = async () => {
//             if (!experienceId) return;
//             setIsLoading(true);
//             try {
//                 const response = await fetch(`/api/company-settings?experienceId=${experienceId}`);
//                 const data = await response.json();
//                 if (data.settings) {
//                     setSettings(data.settings);
//                     setPrice((data.settings.entry_fee_cents / 100).toFixed(2));
//                 }
//             } catch (e) {
//                 setError("Failed to load settings.");
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchSettings();
//     }, [experienceId]);

//     const handleSavePrice = async () => {
//         if (!experienceId) {
//             setError("Missing experience ID. Please go back and try again.");
//             return;
//         }

//         setIsLoading(true);
//         setError(null);

//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }

//             const result = await setTournamentPrice(priceInCents, experienceId);

//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }
            
//             // On success, redirect to the main lobby to see the changes
//             router.push(`/experience/${experienceId}`);

//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-lg bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             <h1 className="text-3xl text-yellow-300 mb-4">Creator Dashboard</h1>
//             <p className="text-white/80 mb-6">Manage your tournament settings here.</p>
            
//             <fieldset disabled={isPriceLocked || isLoading} className="space-y-4 border-t border-white/10 pt-6">
//                 <legend className="text-xl text-white font-semibold mb-2">Entry Fee</legend>
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input
//                         type="number"
//                         step="0.01"
//                         min="1.00"
//                         value={price}
//                         onChange={(e) => setPrice(e.target.value)}
//                         className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none disabled:opacity-50"
//                     />
//                 </div>

//                 {isPriceLocked && canChangeDate && (
//                     <p className="text-xs text-orange-400 mt-2">
//                         Price is locked. You can change it again after {canChangeDate.toLocaleString()}.
//                     </p>
//                 )}

//                 <button
//                     onClick={handleSavePrice}
//                     disabled={isLoading || isPriceLocked}
//                     className="w-full mt-4 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
//                 >
//                     {isLoading ? "Saving..." : "Update Price"}
//                 </button>
//             </fieldset>

//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminDashboardPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading Settings...</div>}>
//                 <AdminDashboard />
//             </Suspense>
//         </div>
//     );
// }
