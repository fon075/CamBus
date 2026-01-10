const express = require("express");
const router = express.Router();
const store = require("../data/store");
const { v4: uuid } = require("uuid");

/**
 * INITIATE PAYMENT
 */
router.post("/initiate", (req, res) => {
  const { bookingId, provider, phoneNumber } = req.body;

  if (!["MTN", "ORANGE"].includes(provider)) {
    return res.status(400).json({ message: "Invalid payment provider" });
  }

  const paymentId = uuid();

  store.payments[paymentId] = {
    paymentId,
    bookingId,
    provider,
    phoneNumber,
    status: "PENDING"
  };

  // Fake payment processing
  setTimeout(() => {
    const success = Math.random() > 0.3;

    store.payments[paymentId].status = success
      ? "SUCCESS"
      : "FAILED";
  }, 3000);

  res.json({
    message: "Payment initiated",
    paymentId,
    status: "PENDING"
  });
});

/**
 * CHECK PAYMENT STATUS
 */
router.get("/status/:paymentId", (req, res) => {
  const payment = store.payments[req.params.paymentId];

  if (!payment) {
    return res.status(404).json({ message: "Payment not found" });
  }

  res.json(payment);
});

module.exports = router;
