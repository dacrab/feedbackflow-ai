/** Alias target that stands in for the `server-only` package under Vitest.
 *  `server-only` throws on import in a non-RSC environment, so vitest.config
 *  points the bare specifier here; knip.json ignores this file because that
 *  string alias is the only thing that references it. */
export {};
