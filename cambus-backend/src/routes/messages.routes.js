const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, messagesController.sendMessage);
router.get('/', authenticate, messagesController.getUserMessages);
router.put('/:id/read', authenticate, messagesController.markAsRead);

module.exports = router;