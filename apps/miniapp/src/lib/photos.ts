import { api } from './api.js';

const cache = new Map<string, Promise<string>>();

export function getPhotoUrl(key: string): Promise<string> {
  const cached = cache.get(key);
  if (cached) return cached;

  const request = api
    .get<{ url: string }>('/uploads/sign-get', { params: { key } })
    .then((response) => response.data.url)
    .catch((error: unknown) => {
      cache.delete(key); // невдалу спробу не запамʼятовуємо
      throw error;
    });

  cache.set(key, request);
  return request;
}
