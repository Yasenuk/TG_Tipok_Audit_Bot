import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../env.js';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

// TODO: createPresignedPut(mimeType): { key, url }
// TODO: createPresignedGet(key): url
// TODO: deleteOrphans(): прибирання ключів без посилань в AuditItem
