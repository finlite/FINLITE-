const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.post('/', supportController.createSupportTicket);
router.get('/', supportController.getUserTickets);

module.exports = router;
