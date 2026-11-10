import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getProduct,
  listCategories,
  listProducts,
  updateProduct,
} from '../controllers/productController.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { validateObjectId, validateProductBody } from '../middleware/validate.js'
import { uploadProductImage, verifyUploadedImage } from '../middleware/upload.js'

const router = Router()

router.get('/', listProducts)
router.get('/categories', listCategories)
router.get('/:id', validateObjectId, getProduct)
router.post('/', requireAuth, requireAdmin, uploadProductImage, verifyUploadedImage, validateProductBody, createProduct)
router.put('/:id', requireAuth, requireAdmin, validateObjectId, uploadProductImage, verifyUploadedImage, validateProductBody, updateProduct)
router.delete('/:id', requireAuth, requireAdmin, validateObjectId, deleteProduct)

export default router
