import axios from 'axios';
import { tg } from './telegram.js';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  config.headers['x-init-data'] = tg?.initData ?? '';

  const devTgId = import.meta.env.VITE_DEV_TG_ID;
  if (devTgId) config.headers['x-dev-tg-id'] = devTgId;

  return config;
});
