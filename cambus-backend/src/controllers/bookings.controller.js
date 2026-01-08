const supabase = require('../config/supabase');
const paymentService = require('../services/payment.service');
const { generateBookingReference } = require('../utils/helpers');

exports.createBooking = async (req, res) => {
  try {
    const { schedule_id, seat_id, passenger_name, passenger_phone, passenger_email, passenger_id_number } = req.body;

    // Check if seat is available
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('schedule_id', schedule_id)
      .eq('seat_id', seat_id)
      .in('booking_status', ['confirmed', 'pending'])
      .single();

    if (existingBooking) {
      return res.status(400).json({ error: 'Seat already booked' });
    }

    // Get schedule price
    const { data: schedule } = await supabase
      .from('schedules')
      .select('price, available_seats')
      .eq('id', schedule_id)
      .single();

    if (schedule.available_seats <= 0) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Create booking
    const bookingReference = generateBookingReference();
    const seatLockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        passenger_id: req.user.id,
        schedule_id,
        seat_id,
        booking_reference: bookingReference,
        passenger_name,
        passenger_phone,
        passenger_email,
        passenger_id_number,
        total_amount: schedule.price,
        payment_status: 'pending',
        booking_status: 'pending',
        seat_locked_until: seatLockUntil.toISOString()
      }])
      .select()
      .single();

    if (bookingError) throw bookingError;

    res.status(201).json({
      message: 'Booking created. Complete payment within 15 minutes.',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        schedules (
          departure_time,
          arrival_time,
          routes (origin, destination),
          buses (bus_number, bus_operators (company_name))
        ),
        seats (seat_number)
      `)
      .eq('passenger_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ bookings: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        schedules (
          departure_time,
          arrival_time,
          routes (origin, destination),
          buses (bus_number, bus_operators (company_name))
        ),
        seats (seat_number)
      `)
      .eq('id', id)
      .eq('passenger_id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ booking: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bookings')
      .update({ booking_status: 'cancelled' })
      .eq('id', id)
      .eq('passenger_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Update available seats
    const { data: schedule } = await supabase
      .from('schedules')
      .select('available_seats')
      .eq('id', data.schedule_id)
      .single();

    await supabase
      .from('schedules')
      .update({ available_seats: schedule.available_seats + 1 })
      .eq('id', data.schedule_id);

    res.json({ message: 'Booking cancelled', booking: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method = 'nkap_pay' } = req.body;

    // Get booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'Booking already paid' });
    }

    // Process payment (mock)
    const paymentResult = await paymentService.processPayment({
      amount: booking.total_amount,
      booking_id: booking.id,
      payment_method
    });

    if (paymentResult.status === 'success') {
      // Update booking
      const { data: updatedBooking } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          booking_status: 'confirmed',
          payment_reference: paymentResult.reference
        })
        .eq('id', id)
        .select()
        .single();

      // Update schedule available seats
      const { data: schedule } = await supabase
        .from('schedules')
        .select('available_seats')
        .eq('id', booking.schedule_id)
        .single();

      await supabase
        .from('schedules')
        .update({ available_seats: schedule.available_seats - 1 })
        .eq('id', booking.schedule_id);

      // Create payment record
      await supabase
        .from('payments')
        .insert([{
          booking_id: booking.id,
          amount: booking.total_amount,
          payment_method,
          payment_reference: paymentResult.reference,
          transaction_id: paymentResult.transaction_id,
          status: 'success',
          payment_date: new Date().toISOString()
        }]);

      res.json({
        message: 'Payment successful',
        booking: updatedBooking,
        payment: paymentResult
      });
    } else {
      // Update payment status to failed
      await supabase
        .from('bookings')
        .update({ payment_status: 'failed' })
        .eq('id', id);

      res.status(400).json({
        error: 'Payment failed',
        details: paymentResult
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
