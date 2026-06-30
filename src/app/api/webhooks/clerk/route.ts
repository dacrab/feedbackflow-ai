import { NextResponse } from "next/server";
import { Webhook } from "svix";

const webhookSecret = process.env["CLERK_WEBHOOK_SECRET"];

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

  let evt: { type: string; data: Record<string, unknown> };
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as { type: string; data: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;

  const { db } = await import("@/db/client");
  const { user } = await import("@/db/schema");
  const { sql } = await import("drizzle-orm");

  if (eventType === "user.created" || eventType === "user.updated") {
    const clerkId = data["id"] as string;
    const emailAddresses = data["email_addresses"] as Array<{ email_address: string }> | undefined;
    const email = emailAddresses?.[0]?.email_address ?? "";
    const firstName = (data["first_name"] as string) ?? "";
    const lastName = (data["last_name"] as string) ?? "";
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
    const clerkId = data["id"] as string;
    await db.delete(user).where(sql`${user.id} = ${clerkId}`);
  }

  return NextResponse.json({ received: true });
}

export { handle as POST };
