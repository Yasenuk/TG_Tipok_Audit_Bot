import { Router } from 'express';

export const adminRouter = Router();

// CRUD: /stores, /checklist, /users
adminRouter.all('/{*splat}', (_req, res) => res.status(501).json({ error: 'not implemented' }));
