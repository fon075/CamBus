const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, bookingsController.createBooking);
router.get('/', authenticate, bookingsController.getUserBookings);
router.get('/:id', authenticate, bookingsController.getBookingById);
router.put('/:id/cancel', authenticate, bookingsController.cancelBooking);
router.post('/:id/payment', authenticate, bookingsController.processPayment);

module.exports = router;