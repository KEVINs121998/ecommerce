import { Router } from 'express'
import {
  createOrder,
  listAllOrders,
  listMyOrders,
  updateOrderStatus,
} from '../controllers/orderController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { validateObjectId } from '../middleware/validate.js'

const router = Router()

router.post('/', requireAuth, createOrder)
router.get('/mine', requireAuth, listMyOrders)
router.get('/', requireAuth, requireAdmin, listAllOrders)
router.patch('/:id/status', requireAuth, requireAdmin, validateObjectId, updateOrderStatus)

export default router
