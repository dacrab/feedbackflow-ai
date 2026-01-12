import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import type { userNotifications, userSources } from "@/db/schema";

type UserTable = typeof userSources | typeof userNotifications;

/** Update a user-owned row by id */
export function updateUserRow(
  table: UserTable,
  id: string,
  userId: string,
  data: Record<string, unknown>,
) {
  return db
    .update(table)
    .set(data)
    .where(and(eq(table.id, id), eq(table.userId, userId)));
}

/** Delete a user-owned row by id */
export function deleteUserRow(table: UserTable, id: string, userId: string) {
  return db.delete(table).where(and(eq(table.id, id), eq(table.userId, userId)));
}
