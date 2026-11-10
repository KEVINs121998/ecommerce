import { Router } from 'express'
import { getDashboardStats } from '../controllers/adminController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/stats', requireAuth, requireAdmin, getDashboardStats)

export default router
