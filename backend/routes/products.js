const express = require('express');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/products');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', rbacMiddleware(['manager', 'admin']), createProduct);
router.put('/:id', rbacMiddleware(['manager', 'admin']), updateProduct);
router.delete('/:id', rbacMiddleware(['manager', 'admin']), deleteProduct);

module.exports = router;
