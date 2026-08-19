import './load-env.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client.js';

// Prisma 7: без драйвер-адаптера клієнт не стартує — рушій винесли в pg
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
