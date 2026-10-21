const express = require('express');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { createSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('../controllers/suppliers');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSuppliers);
router.post('/', rbacMiddleware(['manager', 'admin']), createSupplier);
router.put('/:id', rbacMiddleware(['manager', 'admin']), updateSupplier);
router.delete('/:id', rbacMiddleware(['manager', 'admin']), deleteSupplier);

module.exports = router;
