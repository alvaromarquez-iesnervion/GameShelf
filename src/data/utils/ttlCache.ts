/**
 * Simple in-memory TTL cache.
 * Expired entries are evicted lazily on `get`.
 */
export class TtlCache<K, V> {
    private cache = new Map<K, { value: V; expiresAt: number }>();

    set(key: K, value: V, ttlMs: number): void {
        this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    }

    get(key: K): V | undefined {
        const entry = this.cache.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }

    clear(): void {
        this.cache.clear();
    }
}
