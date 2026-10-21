const express = require('express');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { getSummary, getTopProducts, getStockMovement } = require('../controllers/dashboard');

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware(['manager', 'admin']));

router.get('/summary', getSummary);
router.get('/top-products', getTopProducts);
router.get('/stock-movement', getStockMovement);

module.exports = router;
