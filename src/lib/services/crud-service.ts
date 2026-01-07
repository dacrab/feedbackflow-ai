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
import { transformRowWithSecret } from "@/lib/utils";
import type {
  CreateNotificationInput,
  CreateSourceInput,
  UpdateNotificationInput,
  UpdateSourceInput,
} from "@/lib/validations";

type RowType = UserSourceRow | UserNotificationRow;
type TransformedType = TransformedSourceRow | TransformedNotificationRow;

const tables = {
  user_sources: {
    table: userSources,
    cols: {
      id: userSources.id,
      type: userSources.type,
      config: userSources.config,
      enabled: userSources.enabled,
      secret_cipher: userSources.secretCipher,
      userId: userSources.userId,
      createdAt: userSources.createdAt,
    },
  },
  user_notifications: {
    table: userNotifications,
    cols: {
      id: userNotifications.id,
      type: userNotifications.type,
      config: userNotifications.config,
      enabled: userNotifications.enabled,
      secret_cipher: userNotifications.secretCipher,
      userId: userNotifications.userId,
      createdAt: userNotifications.createdAt,
    },
  },
} as const;

export class CRUDService {
  private t: (typeof tables)["user_sources"] | (typeof tables)["user_notifications"];
  constructor(
    private tableName: "user_sources" | "user_notifications",
    private userId: string,
  ) {
    this.t = tables[tableName];
  }

  async list(): Promise<TransformedType[]> {
    const rows = await db
      .select({
        id: this.t.cols.id,
        type: this.t.cols.type,
        config: this.t.cols.config,
        enabled: this.t.cols.enabled,
        secret_cipher: this.t.cols.secret_cipher,
      })
      .from(this.t.table)
      .where(eq(this.t.cols.userId, this.userId))
      .orderBy(desc(this.t.cols.createdAt));
    return (rows as RowType[]).map(transformRowWithSecret) as TransformedType[];
  }

  async create(input: CreateSourceInput | CreateNotificationInput): Promise<TransformedType> {
    const isSource = this.tableName === "user_sources";
    const token = (input as CreateSourceInput).token;
    const values = isSource
      ? {
          userId: this.userId,
          type: (input as CreateSourceInput).type,
          config: { repo: (input as CreateSourceInput).repo },
          secretCipher: token ? encrypt(token) : null,
          enabled: input.enabled ?? true,
        }
      : {
          userId: this.userId,
          type: (input as CreateNotificationInput).type,
          config: { kind: "slack" },
          secretCipher: encrypt((input as CreateNotificationInput).webhook),
          enabled: input.enabled ?? true,
        };

    const [row] = await db.insert(this.t.table).values(values).returning({
      id: this.t.cols.id,
      type: this.t.cols.type,
      config: this.t.cols.config,
      enabled: this.t.cols.enabled,
      secret_cipher: this.t.cols.secret_cipher,
    });
    return transformRowWithSecret(row as RowType) as TransformedType;
  }

  async update(id: string, input: UpdateSourceInput | UpdateNotificationInput): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (typeof input.enabled === "boolean") updates["enabled"] = input.enabled;

    if (this.tableName === "user_sources") {
      const { repo, token } = input as UpdateSourceInput;
      if (typeof repo === "string") updates["config"] = { repo };
      if (typeof token === "string") updates["secretCipher"] = token ? encrypt(token) : null;
    } else {
      const { webhook } = input as UpdateNotificationInput;
      if (typeof webhook === "string") updates["secretCipher"] = webhook ? encrypt(webhook) : null;
    }

    await db
      .update(this.t.table)
      .set(updates)
      .where(and(eq(this.t.cols.id, id), eq(this.t.cols.userId, this.userId)));
  }

  async delete(id: string): Promise<void> {
    await db
      .delete(this.t.table)
      .where(and(eq(this.t.cols.id, id), eq(this.t.cols.userId, this.userId)));
  }
}
