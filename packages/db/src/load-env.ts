import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// .env лежить у корені репо, а скрипти запускаються з різних воркспейсів,
// тому шлях рахуємо від цього файлу, а не від cwd
const here = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(here, '../../../.env'), quiet: true });
