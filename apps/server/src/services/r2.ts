import { randomUUID } from 'node:crypto';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env.js';
import { HttpError } from '../lib/http-error.js';

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type AllowedMime = keyof typeof EXTENSIONS;

const PUT_TTL_SECONDS = 5 * 60;
const GET_TTL_SECONDS = 60 * 60;
const KEY_PREFIX = 'audits';
const DELETE_BATCH = 1000;

let cached: S3Client | null = null;

function client(): S3Client {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new HttpError(503, 'Сховище фото не налаштоване');
  }

  cached ??= new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  return cached;
}

export function isAllowedMime(value: string): value is AllowedMime {
  return value in EXTENSIONS;
}

export function isOwnKey(key: string): boolean {
  return key.startsWith(`${KEY_PREFIX}/`) && !key.includes('..');
}

export async function createPresignedPut(
  mimeType: AllowedMime,
): Promise<{ key: string; url: string }> {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const key = `${KEY_PREFIX}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${EXTENSIONS[mimeType]}`;

  const url = await getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: mimeType }),
    { expiresIn: PUT_TTL_SECONDS },
  );

  return { key, url };
}

export async function createPresignedGet(key: string): Promise<string> {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), {
    expiresIn: GET_TTL_SECONDS,
  });
}

export interface StoredObject {
  key: string;
  lastModified: Date;
}

export async function listAllObjects(): Promise<StoredObject[]> {
  const objects: StoredObject[] = [];
  let token: string | undefined;

  do {
    const page = await client().send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET,
        Prefix: `${KEY_PREFIX}/`,
        ContinuationToken: token,
      }),
    );

    for (const item of page.Contents ?? []) {
      if (item.Key && item.LastModified) {
        objects.push({ key: item.Key, lastModified: item.LastModified });
      }
    }

    token = page.NextContinuationToken;
  } while (token);

  return objects;
}

export async function deleteObjects(keys: string[]): Promise<void> {
  for (let index = 0; index < keys.length; index += DELETE_BATCH) {
    const batch = keys.slice(index, index + DELETE_BATCH);

    await client().send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      }),
    );
  }
}
