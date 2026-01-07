import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { appUsers } from "@/db/schema";
import { BCRYPT_ROUNDS } from "@/lib/constants";
import { extractErrorMessage, normalizeEmail } from "@/lib/utils";
import { parseOrError, RegisterSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const parsed = parseOrError(RegisterSchema, await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const email = normalizeEmail(parsed.data.email);
    const [existing] = await db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.email, email))
      .limit(1);
    if (existing)
      return NextResponse.json(
        { error: "Account already exists. Please sign in." },
        { status: 409 },
      );

    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);
    const [user] = await db
      .insert(appUsers)
      .values({ email, passwordHash })
      .returning({ id: appUsers.id, email: appUsers.email });
    if (!user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 });
  }
}
