/**
 * Generic CRUD service for user sources and notifications
 */

import { encrypt } from "@/lib/crypto";
import { createRouteHandlerClient } from "@/lib/supabase/server";
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

  async list(): Promise<TransformedType[]> {
    const supa = await createRouteHandlerClient();
    const { data, error } = await supa
      .from(this.table)
      .select("id, type, config, enabled, secret_cipher")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return ((data || []) as RowType[]).map(transformRowWithSecret) as TransformedType[];
  }

  async create(input: CreateSourceInput | CreateNotificationInput): Promise<TransformedType> {
    const supa = await createRouteHandlerClient();

    if (this.table === "user_sources") {
      const { type, repo, token, enabled = true } = input as CreateSourceInput;
      const { data, error } = await supa
        .from(this.table)
        .insert({
          user_id: this.userId,
          type,
          config: { repo },
          secret_cipher: token ? encrypt(token) : null,
          enabled,
        })
        .select("id, type, config, enabled, secret_cipher")
        .single();

      if (error) throw new Error(error.message);
      return transformRowWithSecret(data as RowType);
    } else {
      const { type, webhook, enabled = true } = input as CreateNotificationInput;
      const { data, error } = await supa
        .from(this.table)
        .insert({
          user_id: this.userId,
          type,
          config: { kind: "slack" },
          secret_cipher: encrypt(webhook),
          enabled,
        })
        .select("id, type, config, enabled, secret_cipher")
        .single();

      if (error) throw new Error(error.message);
      return transformRowWithSecret(data as RowType);
    }
  }

  async update(id: string, input: UpdateSourceInput | UpdateNotificationInput): Promise<void> {
    const supa = await createRouteHandlerClient();
    const updates: Record<string, unknown> = {};

    if (this.table === "user_sources") {
      const { enabled, repo, token } = input as UpdateSourceInput;
      if (typeof enabled === "boolean") updates["enabled"] = enabled;
      if (typeof repo === "string") updates["config"] = { repo };
      if (typeof token === "string") {
        updates["secret_cipher"] = token ? encrypt(token) : null;
      }
    } else {
      const { enabled, webhook } = input as UpdateNotificationInput;
      if (typeof enabled === "boolean") updates["enabled"] = enabled;
      if (typeof webhook === "string") {
        updates["secret_cipher"] = webhook ? encrypt(webhook) : null;
      }
    }

    const { error } = await supa
      .from(this.table)
      .update(updates)
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const supa = await createRouteHandlerClient();
    const { error } = await supa.from(this.table).delete().eq("id", id).eq("user_id", this.userId);

    if (error) throw new Error(error.message);
  }
}
