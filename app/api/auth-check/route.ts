// app/api/auth-check/route.ts
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const user = await whopSdk.verifyUserToken(await headers());
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ userId: user.userId });
    } catch (e) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
