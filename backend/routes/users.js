const express = require('express');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { getUsers, updateUserRole } = require('../controllers/users');

const router = express.Router();

router.use(authMiddleware);
router.use(rbacMiddleware(['admin']));

router.get('/', getUsers);
router.put('/:id', updateUserRole);

module.exports = router;
