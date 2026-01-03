const express = require('express');
const router = express.Router();
const seatsController = require('../controllers/seats.controller');

router.get('/bus/:busId', seatsController.getSeatsByBus);

module.exports = router;
