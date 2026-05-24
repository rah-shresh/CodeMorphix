import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    return NextResponse.json({ credits: user.credits });
  } catch (error) {
    console.error("Failed to fetch credits:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
