const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/bus-operators.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', operatorController.getAllOperators);
router.get('/:id', operatorController.getOperatorById);
router.post('/', authenticate, authorize('admin'), operatorController.createOperator);
router.put('/:id', authenticate, authorize('admin', 'operator'), operatorController.updateOperator);
router.delete('/:id', authenticate, authorize('admin'), operatorController.deleteOperator);

module.exports = router;
