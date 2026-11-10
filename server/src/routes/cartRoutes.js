import { Router } from 'express'
import { getCart, mergeCart, replaceCart } from '../controllers/cartController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)
router.get('/', getCart)
router.put('/', replaceCart)
router.post('/merge', mergeCart)

export default router
