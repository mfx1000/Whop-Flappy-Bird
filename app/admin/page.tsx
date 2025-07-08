// app/admin/page.tsx
"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTournamentPrice } from '../actions';

// The main form component is wrapped in Suspense so it can use searchParams
function AdminSetupForm() {
    const [price, setPrice] = useState('2.00');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const experienceId = searchParams.get('experienceId');

    const handleSavePrice = async () => {
        if (!experienceId) {
            setError("Missing experience ID. Please go back and try again.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const priceInCents = Math.round(parseFloat(price) * 100);
            if (isNaN(priceInCents) || priceInCents < 100) {
                throw new Error("Price must be at least $1.00.");
            }

            // Call the Server Action directly, passing the experienceId
            const result = await setTournamentPrice(priceInCents, experienceId);

            if (!result.success) {
                throw new Error(result.error || "Failed to save price.");
            }

            // Redirect back to the main lobby for that experience
            router.push(`/experience/${experienceId}`);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
            <h1 className="text-3xl text-yellow-300 mb-4">Welcome, Creator!</h1>
            <p className="text-white/80 mb-6">Set the entry fee for your community's daily Flappy Bird tournament.</p>
            
            <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-bold">$</span>
                <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
                />
            </div>
            <p className="text-xs text-gray-400 mt-2">Minimum entry fee is $1.00</p>

            <button
                onClick={handleSavePrice}
                disabled={isLoading}
                className="w-full mt-8 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
            >
                {isLoading ? "Saving..." : "Save and Start Tournament"}
            </button>
            {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
    );
}

// The page itself just provides the Suspense boundary
export default function AdminSetupPage() {
    return (
        <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <AdminSetupForm />
            </Suspense>
        </div>
    );
}


// // app/admin/page.tsx
// "use client";

// import { useState, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice } from '../actions';

// // The main form component is wrapped in Suspense so it can use searchParams
// function AdminSetupForm() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

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

//             // Call the Server Action directly, passing the experienceId
//             const result = await setTournamentPrice(priceInCents, experienceId);

//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }

//             // Redirect back to the main lobby for that experience
//             router.push(`/experience/${experienceId}`);

//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             <h1 className="text-3xl text-yellow-300 mb-4">Welcome, Creator!</h1>
//             <p className="text-white/80 mb-6">Set the entry fee for your community's daily Flappy Bird tournament.</p>
            
//             <div className="flex items-center justify-center gap-2">
//                 <span className="text-4xl font-bold">$</span>
//                 <input
//                     type="number"
//                     step="0.01"
//                     min="1.00"
//                     value={price}
//                     onChange={(e) => setPrice(e.target.value)}
//                     className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
//                 />
//             </div>
//             <p className="text-xs text-gray-400 mt-2">Minimum entry fee is $1.00</p>

//             <button
//                 onClick={handleSavePrice}
//                 disabled={isLoading}
//                 className="w-full mt-8 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
//             >
//                 {isLoading ? "Saving..." : "Save and Start Tournament"}
//             </button>
//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminSetupPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading...</div>}>
//                 <AdminSetupForm />
//             </Suspense>
//         </div>
//     );
// }


// // app/admin/page.tsx
// "use client";

// import { useState, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { setTournamentPrice } from '../actions';

// // The main form component is wrapped in Suspense so it can use searchParams
// function AdminSetupForm() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const experienceId = searchParams.get('experienceId');

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

//             // Call the Server Action directly, passing the experienceId
//             const result = await setTournamentPrice(priceInCents, experienceId);

//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }

//             // Redirect back to the main lobby for that experience
//             router.push(`/experience/${experienceId}`);

//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//             <h1 className="text-3xl text-yellow-300 mb-4">Welcome, Creator!</h1>
//             <p className="text-white/80 mb-6">Set the entry fee for your community's daily Flappy Bird tournament.</p>
            
//             <div className="flex items-center justify-center gap-2">
//                 <span className="text-4xl font-bold">$</span>
//                 <input
//                     type="number"
//                     step="0.01"
//                     min="1.00"
//                     value={price}
//                     onChange={(e) => setPrice(e.target.value)}
//                     className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
//                 />
//             </div>
//             <p className="text-xs text-gray-400 mt-2">Minimum entry fee is $1.00</p>

//             <button
//                 onClick={handleSavePrice}
//                 disabled={isLoading}
//                 className="w-full mt-8 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
//             >
//                 {isLoading ? "Saving..." : "Save and Start Tournament"}
//             </button>
//             {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//         </div>
//     );
// }

// // The page itself just provides the Suspense boundary
// export default function AdminSetupPage() {
//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <Suspense fallback={<div>Loading...</div>}>
//                 <AdminSetupForm />
//             </Suspense>
//         </div>
//     );
// }


// // app/admin/page.tsx
// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { setTournamentPrice } from '../actions'; // Import the Server Action

// export default function AdminSetupPage() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const router = useRouter();

//     const handleSavePrice = async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }

//             // Call the Server Action directly instead of using fetch
//             const result = await setTournamentPrice(priceInCents);

//             if (!result.success) {
//                 throw new Error(result.error || "Failed to save price.");
//             }

//             // On success, redirect to the main lobby
//             router.push('/');

//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <div className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//                 <h1 className="text-3xl text-yellow-300 mb-4">Welcome, Creator!</h1>
//                 <p className="text-white/80 mb-6">Set the entry fee for your community's daily Flappy Bird tournament.</p>
                
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input
//                         type="number"
//                         step="0.01"
//                         min="1.00"
//                         value={price}
//                         onChange={(e) => setPrice(e.target.value)}
//                         className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
//                     />
//                 </div>
//                 <p className="text-xs text-gray-400 mt-2">Minimum entry fee is $1.00</p>

//                 <button
//                     onClick={handleSavePrice}
//                     disabled={isLoading}
//                     className="w-full mt-8 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
//                 >
//                     {isLoading ? "Saving..." : "Save and Start Tournament"}
//                 </button>
//                 {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//             </div>
//         </div>
//     );
// }


// // app/admin/page.tsx
// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useIframeSdk } from '@whop/react'; // Import the hook

// export default function AdminSetupPage() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const router = useRouter();
//     const iframeSdk = useIframeSdk(); // Get the SDK instance

//     const handleSavePrice = async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }

//             // FIX: Replaced the incorrect '.proxy()' method with a standard 'fetch'.
//             // The Whop iframe environment should automatically add the auth headers.
//             const response = await fetch('/api/admin/set-price', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ priceInCents }),
//             });

//             if (!response.ok) {
//                 const data = await response.json();
//                 throw new Error(data.error || "Failed to save price.");
//             }

//             // On success, redirect to the main lobby
//             router.push('/');
//             router.refresh(); // Force a refresh to fetch new data

//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <div className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//                 <h1 className="text-3xl text-yellow-300 mb-4">Welcome, Creator!</h1>
//                 <p className="text-white/80 mb-6">Set the entry fee for your community's daily Flappy Bird tournament.</p>
                
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input
//                         type="number"
//                         step="0.01"
//                         min="1.00"
//                         value={price}
//                         onChange={(e) => setPrice(e.target.value)}
//                         className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
//                     />
//                 </div>
//                 <p className="text-xs text-gray-400 mt-2">Minimum entry fee is $1.00</p>

//                 <button
//                     onClick={handleSavePrice}
//                     disabled={isLoading}
//                     className="w-full mt-8 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
//                 >
//                     {isLoading ? "Saving..." : "Save and Start Tournament"}
//                 </button>
//                 {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//             </div>
//         </div>
//     );
// }


// // app/admin/page.tsx
// "use client";

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function AdminSetupPage() {
//     const [price, setPrice] = useState('2.00');
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const router = useRouter();

//     const handleSavePrice = async () => {
//         setIsLoading(true);
//         setError(null);

//         try {
//             const priceInCents = Math.round(parseFloat(price) * 100);
//             if (isNaN(priceInCents) || priceInCents < 100) {
//                 throw new Error("Price must be at least $1.00.");
//             }

//             const response = await fetch('/api/admin/set-price', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ priceInCents }),
//             });

//             if (!response.ok) {
//                 const data = await response.json();
//                 throw new Error(data.error || "Failed to save price.");
//             }

//             // On success, redirect to the main lobby
//             router.push('/');
//             router.refresh(); // Force a refresh to fetch new data

//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//             setError(errorMessage);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="min-h-screen w-full bg-flappy-bg bg-cover bg-center flex flex-col items-center justify-center font-pixel text-white p-4">
//             <div className="w-full max-w-md bg-black/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-white/20 text-center">
//                 <h1 className="text-3xl text-yellow-300 mb-4">Welcome, Creator!</h1>
//                 <p className="text-white/80 mb-6">Set the entry fee for your community's daily Flappy Bird tournament.</p>
                
//                 <div className="flex items-center justify-center gap-2">
//                     <span className="text-4xl font-bold">$</span>
//                     <input
//                         type="number"
//                         step="0.01"
//                         min="1.00"
//                         value={price}
//                         onChange={(e) => setPrice(e.target.value)}
//                         className="w-48 bg-gray-800 text-white text-4xl font-bold text-center rounded-lg p-2 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none"
//                     />
//                 </div>
//                 <p className="text-xs text-gray-400 mt-2">Minimum entry fee is $1.00</p>

//                 <button
//                     onClick={handleSavePrice}
//                     disabled={isLoading}
//                     className="w-full mt-8 rounded-lg px-8 py-4 text-xl font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
//                 >
//                     {isLoading ? "Saving..." : "Save and Start Tournament"}
//                 </button>
//                 {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
//             </div>
//         </div>
//     );
// }
