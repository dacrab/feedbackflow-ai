import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import { db } from "@/db/client";
import { user } from "@/db/schema";

const ClerkEventSchema = z.object({
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const ClerkUserSchema = z.object({
  id: z.string(),
  email_addresses: z.array(z.object({ email_address: z.string() })).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

async function handle(req: Request) {
  // Read per request so a runtime env injection is not missed.
  const webhookSecret = process.env["CLERK_WEBHOOK_SECRET"];
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!(svixId && svixTimestamp && svixSignature)) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let evt: z.infer<typeof ClerkEventSchema>;
  try {
    evt = ClerkEventSchema.parse(
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }),
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const { type: eventType } = evt;

  // Only user.* events carry a shape we use; ack everything else.
  if (!eventType.startsWith("user.")) {
    return NextResponse.json({ received: true });
  }

  const parsed = ClerkUserSchema.safeParse(evt.data);
  if (!parsed.success) {
    // Ack an unexpected shape rather than 500, so Clerk stops retrying.
    return NextResponse.json({ received: true });
  }
  const data = parsed.data;

  if (eventType === "user.created" || eventType === "user.updated") {
    const clerkId = data.id;
    // Clerk can omit the email, but the column is NOT NULL + UNIQUE, so
    // synthesize a stable placeholder.
    const email = data.email_addresses?.[0]?.email_address ?? `${clerkId}@users.clerk.local`;
    const firstName = data.first_name ?? "";
    const lastName = data.last_name ?? "";
    const name = [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0] || "User";

    await db
      .insert(user)
      .values({ id: clerkId, email, name })
      .onConflictDoUpdate({
        target: user.id,
        set: { email, name, updatedAt: new Date() },
      });
  }

  if (eventType === "user.deleted") {
    const clerkId = data.id;
    await db.delete(user).where(eq(user.id, clerkId));
  }

  return NextResponse.json({ received: true });
}

export { handle as POST };
