const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.post('/', supportController.createSupportTicket);
router.get('/', supportController.getUserTickets);

module.exports = router;
