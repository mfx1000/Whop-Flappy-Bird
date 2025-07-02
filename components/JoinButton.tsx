// // components/JoinButton.tsx
// "use client";

// import { useIframeSdk } from "@whop/react";
// import { useState } from "react";

// export default function JoinButton() {
//   const iframeSdk = useIframeSdk();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleJoin = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       // Step 1: Call our backend API to create the charge
//       const response = await fetch("/api/join", {
//         method: "POST",
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to create checkout session.");
//       }

//       const inAppPurchase = await response.json();

//       // Step 2: Use the response to open the Whop payment modal
//       if (iframeSdk && inAppPurchase) {
//         const result = await iframeSdk.inAppPurchase(inAppPurchase);

//         // Step 3: Handle the result of the payment
//         if (result.status === "ok") {
//           // Payment successful! Redirect to the game.
//           window.location.href = "/game";
//         } else {
//           // User closed the modal or an error occurred
//           console.error("Payment failed or was cancelled:", result.error);
//           setError("Payment was cancelled.");
//         }
//       }
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
//       console.error("Error joining tournament:", errorMessage);
//       setError(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col items-center gap-2">
//       <button
//         onClick={handleJoin}
//         disabled={isLoading}
//         className="mt-6 inline-block rounded-lg bg-blue-500 px-8 py-4 text-xl font-semibold text-white hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
//       >
//         {isLoading ? "Processing..." : "Join Tournament ($2.00)"}
//       </button>
//       {error && <p className="text-red-400 text-sm">{error}</p>}
//     </div>
//   );
// }

// components/JoinButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = () => {
    setIsLoading(true);
    // MOCK BEHAVIOR: For development, we navigate directly to the game.
    // We will replace this with the real payment logic in the final step.
    router.push("/game");
  };
    
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleJoin}
        disabled={isLoading}
        className="mt-6 inline-block rounded-lg bg-green-500 px-8 py-4 text-xl font-semibold text-white hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading..." : "Play Now (Dev Mode)"}
      </button>
    </div>
  );
}
