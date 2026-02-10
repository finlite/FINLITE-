const express = require('express');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const authenticateToken = require('../middlewares/auth.middleware');

router.use(authenticateToken);

router.get('/', businessController.getBusinessInfo);
router.post('/', businessController.upsertBusinessInfo);
router.put('/', businessController.upsertBusinessInfo); // Allow PUT as well for updates

module.exports = router;
