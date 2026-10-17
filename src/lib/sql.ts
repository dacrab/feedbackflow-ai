/** Escape LIKE/ILIKE wildcards so user input is matched literally. Pair with an
 *  explicit `ESCAPE '\'` in the query. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, "\\$&");
}
