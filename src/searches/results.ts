/**
 * Turn a lookup into a search result: a missing record means "nothing found", not an error.
 */
export const found = async <T>(lookup: Promise<T | null>): Promise<T[]> => {
  const record = await lookup;

  return record === null ? [] : [record];
};
