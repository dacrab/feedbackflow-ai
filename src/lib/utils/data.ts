/**
 * Shared data transformation utilities
 */

type RowWithSecret = {
  id: string;
  type: string;
  config: Record<string, unknown> | null;
  enabled: boolean;
  secret_cipher: string | null;
};

/**
 * Transform row with secret_cipher to include hasSecret flag
 */
export function transformRowWithSecret<T extends RowWithSecret>(row: T) {
  return {
    id: row.id,
    type: row.type,
    config: row.config,
    enabled: row.enabled,
    hasSecret: Boolean(row.secret_cipher),
  };
}
