const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { v4: uuid } = require("uuid");

/**
 * CREATE BOOKING
 */
router.post("/create", (req, res) => {
  const { passengerName, route, seatNumber } = req.body;

  if (store.seats[seatNumber]?.locked) {
    return res.status(409).json({ message: "Seat already locked" });
  }

  const bookingId = uuid();

  store.bookings[bookingId] = {
    bookingId,
    passengerName,
    route,
    seatNumber,
    status: "CREATED"
  };

  res.json({
    message: "Booking created",
    bookingId
  });
});

/**
 * LOCK SEAT
 */
router.post("/lock-seat", (req, res) => {
  const { bookingId } = req.body;
  const booking = store.bookings[bookingId];

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const seat = booking.seatNumber;

  if (store.seats[seat]?.locked) {
    return res.status(409).json({ message: "Seat already locked" });
  }

  store.seats[seat] = { locked: true };
  booking.status = "SEAT_LOCKED";

  res.json({ message: "Seat locked successfully" });
});

/**
 * CONFIRM BOOKING
 */
router.post("/confirm", (req, res) => {
  const { bookingId } = req.body;
  const booking = store.bookings[bookingId];

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  booking.status = "CONFIRMED";

  res.json({
    message: "Booking confirmed",
    booking
  });
});

module.exports = router;
