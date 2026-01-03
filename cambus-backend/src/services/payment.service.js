const processPayment = async ({ amount, booking_id, payment_method }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate 80% success rate
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        resolve({
          status: 'success',
          reference: `NKAP${Date.now()}${Math.floor(Math.random() * 1000)}`,
          transaction_id: `TXN${Date.now()}`,
          amount,
          payment_method,
          timestamp: new Date().toISOString()
        });
      } else {
        resolve({
          status: 'failed',
          error: 'Payment declined',
          timestamp: new Date().toISOString()
        });
      }
    }, 2000); // Simulate 2 second processing time
  });
};

// FUTURE: Replace with real Nkwa Pay API i'll come back to this
/*
const processPayment = async ({ amount, booking_id, payment_method }) => {
  const response = await fetch('https://api.nkappay.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NKAP_PAY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency: 'XAF',
      reference: booking_id,
      payment_method,
      callback_url: `${process.env.API_URL}/api/payments/callback`
    })
  });
  
  return await response.json();
};
*/

module.exports = { processPayment };
