import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { z } from "zod";
import { db } from "@/db/client";
import { user } from "@/db/schema";

const webhookSecret = process.env["CLERK_WEBHOOK_SECRET"];

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
  if (!webhookSecret) {
    return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let evt: z.infer<typeof ClerkEventSchema>;
  try {
    evt = ClerkEventSchema.parse(
      wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }),
    );
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const eventType = evt.type;

  // Clerk sends many event types (session.*, organization.*, ...). Only the
  // user.* events carry the shape we care about — acknowledge the rest.
  if (!eventType.startsWith("user.")) {
    return NextResponse.json({ received: true });
  }

  const parsed = ClerkUserSchema.safeParse(evt.data);
  if (!parsed.success) {
    // A user.* event with an unexpected shape (e.g. a new Clerk event type)
    // must not 500 — ack it so Clerk stops retrying.
    return NextResponse.json({ received: true });
  }
  const data = parsed.data;

  if (eventType === "user.created" || eventType === "user.updated") {
    const clerkId = data.id;
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
