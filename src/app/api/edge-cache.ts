type WorkerCacheStorage = CacheStorage & { default?: Cache };

function getDefaultCache(): Cache | undefined {
  return (globalThis as { caches?: WorkerCacheStorage }).caches?.default;
}

export async function matchEdgeCache(request: Request) {
  const cache = getDefaultCache();

  if (!cache) {
    return undefined;
  }

  try {
    return await cache.match(request.url);
  } catch (error) {
    console.error("[edge-cache] match failed", error);
    return undefined;
  }
}

export async function putEdgeCache(request: Request, response: Response) {
  const cache = getDefaultCache();

  if (!cache) {
    return;
  }

  try {
    await cache.put(request.url, response.clone());
  } catch (error) {
    console.error("[edge-cache] put failed", error);
  }
}
