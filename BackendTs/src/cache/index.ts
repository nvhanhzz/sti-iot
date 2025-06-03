import NodeCache from "node-cache";

class CacheService {
    private cache: NodeCache;
    constructor() {
        this.cache = new NodeCache({
            stdTTL: 0,
            checkperiod: 0
        });
    }
    set<T>(key: string, value: T): void {
        this.cache.set(key, value);
    }
    get<T>(key: string): T | null {
        return this.cache.get(key) || null;
    }
    del(key: string): void {
        this.cache.del(key);
    }
    flush(): void {
        this.cache.flushAll();
    }
    findOne<T>(predicate: (value: T) => boolean): T | null {
        const keys = this.cache.keys();
        for (const key of keys) {
            const value = this.cache.get<T>(key);
            if (value && predicate(value)) {
                return value;
            }
        }
        return null;
    }
}

export default new CacheService();