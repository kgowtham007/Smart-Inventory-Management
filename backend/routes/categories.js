const express = require('express');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { createCategory, getCategories, updateCategory, deleteCategory } = require('../controllers/categories');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCategories);
router.post('/', rbacMiddleware(['manager', 'admin']), createCategory);
router.put('/:id', rbacMiddleware(['manager', 'admin']), updateCategory);
router.delete('/:id', rbacMiddleware(['manager', 'admin']), deleteCategory);

module.exports = router;
