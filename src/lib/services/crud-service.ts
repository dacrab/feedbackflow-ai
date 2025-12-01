/**
 * Generic CRUD service for user sources and notifications
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { userNotifications, userSources } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import type {
  TransformedNotificationRow,
  TransformedSourceRow,
  UserNotificationRow,
  UserSourceRow,
} from "@/lib/types";
import { transformRowWithSecret } from "@/lib/utils/data";

type TableName = "user_sources" | "user_notifications";
type RowType = UserSourceRow | UserNotificationRow;
type TransformedType = TransformedSourceRow | TransformedNotificationRow;

interface CreateSourceInput {
  type: "github";
  repo: string;
  token?: string | undefined;
  enabled?: boolean | undefined;
}

interface CreateNotificationInput {
  type: "slack";
  webhook: string;
  enabled?: boolean | undefined;
}

interface UpdateSourceInput {
  enabled?: boolean | undefined;
  repo?: string | undefined;
  token?: string | undefined;
}

interface UpdateNotificationInput {
  enabled?: boolean | undefined;
  webhook?: string | undefined;
}

export class CRUDService {
  private table: TableName;
  private userId: string;

  constructor(table: TableName, userId: string) {
    this.table = table;
    this.userId = userId;
  }

  async list(): Promise<Array<TransformedType>> {
    if (this.table === "user_sources") {
      const rows = await db
        .select({
          id: userSources.id,
          type: userSources.type,
          config: userSources.config,
          enabled: userSources.enabled,
          secret_cipher: userSources.secretCipher,
        })
        .from(userSources)
        .where(eq(userSources.userId, this.userId))
        .orderBy(desc(userSources.createdAt));

      return (rows as Array<RowType>).map(transformRowWithSecret) as Array<TransformedType>;
    }

    const rows = await db
      .select({
        id: userNotifications.id,
        type: userNotifications.type,
        config: userNotifications.config,
        enabled: userNotifications.enabled,
        secret_cipher: userNotifications.secretCipher,
      })
      .from(userNotifications)
      .where(eq(userNotifications.userId, this.userId))
      .orderBy(desc(userNotifications.createdAt));

    return (rows as Array<RowType>).map(transformRowWithSecret) as Array<TransformedType>;
  }

  async create(input: CreateSourceInput | CreateNotificationInput): Promise<TransformedType> {
    if (this.table === "user_sources") {
      const { type, repo, token, enabled = true } = input as CreateSourceInput;
      const [row] = await db
        .insert(userSources)
        .values({
          userId: this.userId,
          type,
          config: { repo },
          secretCipher: token ? encrypt(token) : null,
          enabled,
        })
        .returning({
          id: userSources.id,
          type: userSources.type,
          config: userSources.config,
          enabled: userSources.enabled,
          secret_cipher: userSources.secretCipher,
        });

      return transformRowWithSecret(row as RowType) as TransformedType;
    } else {
      const { type, webhook, enabled = true } = input as CreateNotificationInput;
      const [row] = await db
        .insert(userNotifications)
        .values({
          userId: this.userId,
          type,
          config: { kind: "slack" },
          secretCipher: encrypt(webhook),
          enabled,
        })
        .returning({
          id: userNotifications.id,
          type: userNotifications.type,
          config: userNotifications.config,
          enabled: userNotifications.enabled,
          secret_cipher: userNotifications.secretCipher,
        });

      return transformRowWithSecret(row as RowType) as TransformedType;
    }
  }

  async update(id: string, input: UpdateSourceInput | UpdateNotificationInput): Promise<void> {
    const updates: Record<string, unknown> = {};

    if (this.table === "user_sources") {
      const { enabled, repo, token } = input as UpdateSourceInput;
      if (typeof enabled === "boolean") {
        updates["enabled"] = enabled;
      }
      if (typeof repo === "string") {
        updates["config"] = { repo };
      }
      if (typeof token === "string") {
        updates["secretCipher"] = token ? encrypt(token) : null;
      }
      await db
        .update(userSources)
        .set(updates)
        .where(and(eq(userSources.id, id), eq(userSources.userId, this.userId)));
    } else {
      const { enabled, webhook } = input as UpdateNotificationInput;
      if (typeof enabled === "boolean") {
        updates["enabled"] = enabled;
      }
      if (typeof webhook === "string") {
        updates["secretCipher"] = webhook ? encrypt(webhook) : null;
      }
      await db
        .update(userNotifications)
        .set(updates)
        .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, this.userId)));
    }
  }

  async delete(id: string): Promise<void> {
    if (this.table === "user_sources") {
      await db
        .delete(userSources)
        .where(and(eq(userSources.id, id), eq(userSources.userId, this.userId)));
    } else {
      await db
        .delete(userNotifications)
        .where(and(eq(userNotifications.id, id), eq(userNotifications.userId, this.userId)));
    }
  }
}
