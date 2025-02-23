import { Router } from 'express';
import { validateToken } from '../controllers/proxmox.controller';

const router = Router();

router.post('/validate', validateToken);

export default router; 