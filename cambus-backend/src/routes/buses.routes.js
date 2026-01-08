const express = require('express');
const router = express.Router();
const busesController = require('../controllers/buses.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', busesController.getAllBuses);
router.get('/:id', busesController.getBusById);
router.post('/', authenticate, authorize('admin', 'operator'), busesController.createBus);
router.put('/:id', authenticate, authorize('admin', 'operator'), busesController.updateBus);
router.delete('/:id', authenticate, authorize('admin'), busesController.deleteBus);

module.exports = router;
