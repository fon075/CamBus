const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedules.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', schedulesController.getAllSchedules);
router.get('/search', schedulesController.searchSchedules);
router.get('/:id', schedulesController.getScheduleById);
router.get('/:id/availability', schedulesController.getScheduleAvailability);
router.post('/', authenticate, authorize('admin', 'operator'), schedulesController.createSchedule);
router.put('/:id', authenticate, authorize('admin', 'operator'), schedulesController.updateSchedule);
router.delete('/:id', authenticate, authorize('admin'), schedulesController.deleteSchedule);

module.exports = router;