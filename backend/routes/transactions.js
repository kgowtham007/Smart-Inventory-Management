const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { createTransaction, getTransactions } = require('../controllers/transactions');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getTransactions);
router.post('/', createTransaction);

module.exports = router;
