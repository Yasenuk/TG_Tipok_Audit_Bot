import { Router } from 'express';
import { auth, requireAdmin } from '../middleware/auth.js';
import { meRouter } from './me.js';
import { storesRouter } from './stores.js';
import { checklistRouter } from './checklist.js';
import { auditsRouter } from './audits.js';
import { uploadsRouter } from './uploads.js';
import { exportRouter } from './export.js';
import { adminRouter } from './admin.js';

export const apiRouter = Router();

apiRouter.use(auth);
apiRouter.use('/me', meRouter);
apiRouter.use('/stores', storesRouter);
apiRouter.use('/checklist', checklistRouter);
apiRouter.use('/audits', auditsRouter);
apiRouter.use('/uploads', uploadsRouter);
apiRouter.use('/export', requireAdmin, exportRouter);
apiRouter.use('/admin', requireAdmin, adminRouter);
