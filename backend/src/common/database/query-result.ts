/**
 * TypeORM's postgres driver returns UPDATE/DELETE ... RETURNING as
 * `[rows, affectedCount]`, while SELECT and INSERT ... RETURNING return rows
 * directly. Normalize mutation results before checking `.length` or reading
 * the first row.
 */
export function mutationRows<T = Record<string, unknown>>(result: unknown): T[] {
  if (!Array.isArray(result)) return [];
  if (Array.isArray(result[0]) && typeof result[1] === 'number') {
    return result[0] as T[];
  }
  return result as T[];
}
