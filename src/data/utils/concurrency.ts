/**
 * Runs an async function over a list of items, processing at most `limit` items concurrently.
 * Items are processed in chunks, each chunk running in parallel.
 */
export async function runLimited<T, U>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<U>,
): Promise<U[]> {
    const results: U[] = [];
    for (let i = 0; i < items.length; i += limit) {
        const chunk = items.slice(i, i + limit);
        const chunkResults = await Promise.all(chunk.map(fn));
        results.push(...chunkResults);
    }
    return results;
}
