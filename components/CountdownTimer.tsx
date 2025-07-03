// components/CountdownTimer.tsx
"use client";

import { useState, useEffect } from 'react';

// Helper function to calculate the time until the next 1:00 AM UTC
const calculateTimeLeft = () => {
    const now = new Date();
    const nowUtc = new Date(now.toUTCString());

    let targetUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 1, 0, 0, 0));

    // If the target time for today has already passed, set it for tomorrow
    if (nowUtc > targetUtc) {
        targetUtc.setDate(targetUtc.getUTCDate() + 1);
    }

    const difference = targetUtc.getTime() - nowUtc.getTime();

    let timeLeft = {
        hours: '00',
        minutes: '00',
        seconds: '00'
    };

    if (difference > 0) {
        timeLeft = {
            hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
            minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0'),
            seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, '0'),
        };
    }

    return timeLeft;
};

export default function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        // Clear the interval on component unmount
        return () => clearInterval(timer);
    }, []);

    return (
        <p className="text-xs md:text-sm text-center">
            Tournament resets in: 
            <span className="font-bold text-yellow-300 ml-2">
                {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </span>
        </p>
    );
}
