// components/JoinButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIframeSdk } from "@whop/react"; // Assuming real payment logic is active

export default function JoinButton({ isRetry }: { isRetry: boolean }) {
  const router = useRouter();
  const iframeSdk = useIframeSdk();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/join", { method: "POST" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session.");
      }
      const inAppPurchase = await response.json();
      if (iframeSdk && inAppPurchase) {
        const result = await iframeSdk.inAppPurchase(inAppPurchase);
        if (result.status === "ok") {
          router.push("/game");
        } else {
          setError("Payment was cancelled.");
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Changed price from $1.00 to $5.00
  const buttonText = isRetry ? "Retry ($5.00)" : "Join Tournament ($5.00)";
  const buttonClass = isRetry
    ? "bg-orange-500 hover:bg-orange-600"
    : "bg-green-500 hover:bg-green-600";
    
  return (
    <div className="flex flex-col items-center gap-2 mt-6">
      <button
        onClick={handleJoin}
        disabled={isLoading}
        className={`w-full max-w-xs rounded-lg px-6 py-3 text-lg font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:bg-gray-500 disabled:cursor-not-allowed font-pixel ${buttonClass}`}
      >
        {isLoading ? "Processing..." : buttonText}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
