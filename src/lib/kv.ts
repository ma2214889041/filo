/**
 * KV 存储抽象层
 * 生产环境：使用 Cloudflare KV (PERSANA_KV binding)
 * 本地开发：使用内存 Map 作为 fallback
 */

interface KVStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

// 内存 fallback（本地开发用）
const memoryStore = new Map<string, string>();
const localKV: KVStore = {
  async get(key: string) {
    return memoryStore.get(key) ?? null;
  },
  async put(key: string, value: string) {
    memoryStore.set(key, value);
  },
};

export async function getKV(): Promise<KVStore> {
  try {
    // 尝试获取 Cloudflare 环境
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext();
    const kv = (env as unknown as Record<string, unknown>).PERSANA_KV as KVStore | undefined;
    if (kv) return kv;
  } catch {
    // 不在 Cloudflare 环境中，使用内存 fallback
  }
  return localKV;
}

// --- 便捷方法 ---

export async function kvGet<T>(key: string): Promise<T | null> {
  const kv = await getKV();
  const raw = await kv.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function kvPut<T>(key: string, value: T): Promise<void> {
  const kv = await getKV();
  await kv.put(key, JSON.stringify(value));
}

export async function kvAppend<T>(key: string, item: T): Promise<void> {
  const existing = await kvGet<T[]>(key);
  const arr = existing ?? [];
  arr.push(item);
  await kvPut(key, arr);
}
