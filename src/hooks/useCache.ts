'use client';

import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const globalCache = new MemoryCache();

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = globalCache.get(key);
    if (cachedData) {
      setData(cachedData);
      return cachedData;
    }

    // Fetch from source
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      globalCache.set(key, result, options.ttl);
      setData(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, options.ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
    setData(null);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    invalidate,
    refresh
  };
}

export function useCacheMutation<T>(
  key: string,
  mutator: (data: T) => Promise<T>,
  options: CacheOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (data: T) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutator(data);
      globalCache.set(key, result, options.ttl);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [key, mutator, options.ttl]);

  return {
    mutate,
    isLoading,
    error
  };
}

export function useCacheInvalidation() {
  const invalidate = useCallback((key: string) => {
    globalCache.delete(key);
  }, []);

  const invalidatePattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern);
    const keys = globalCache.keys();
    
    keys.forEach(key => {
      if (regex.test(key)) {
        globalCache.delete(key);
      }
    });
  }, []);

  const clearAll = useCallback(() => {
    globalCache.clear();
  }, []);

  const cleanup = useCallback(() => {
    globalCache.cleanup();
  }, []);

  return {
    invalidate,
    invalidatePattern,
    clearAll,
    cleanup
  };
}

// Cache utilities
export const cacheUtils = {
  set: <T>(key: string, data: T, ttl?: number) => globalCache.set(key, data, ttl),
  get: <T>(key: string): T | null => globalCache.get(key),
  has: (key: string) => globalCache.has(key),
  delete: (key: string) => globalCache.delete(key),
  clear: () => globalCache.clear(),
  size: () => globalCache.size(),
  cleanup: () => globalCache.cleanup()
};


