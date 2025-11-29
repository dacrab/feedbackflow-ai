import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { appUsers } from "@/db/schema";
import {
  calculatePasswordScore,
  extractErrorMessage,
  isPasswordValid,
  normalizeEmail,
  validateEmail,
} from "@/lib/utils/auth";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const rawEmail = body.email ?? "";
    const password = body.password ?? "";

    const email = normalizeEmail(rawEmail);
    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const score = calculatePasswordScore(password);
    if (!isPasswordValid(score)) {
      return NextResponse.json(
        { error: "Password does not meet security requirements." },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(appUsers)
      .values({ email, passwordHash })
      .returning({ id: appUsers.id, email: appUsers.email });

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 });
  }
}
