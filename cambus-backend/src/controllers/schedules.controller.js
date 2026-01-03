const supabase = require('../config/supabase');

exports.getAllSchedules = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        routes (origin, destination, distance_km),
        buses (bus_number, plate_number, total_seats, bus_operators (company_name))
      `)
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (error) throw error;

    res.json({ schedules: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchSchedules = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    let query = supabase
      .from('schedules')
      .select(`
        *,
        routes!inner (origin, destination, distance_km, base_price),
        buses (bus_number, total_seats, bus_operators (company_name))
      `)
      .eq('status', 'scheduled')
      .gt('available_seats', 0);

    if (origin && destination) {
      query = query
        .eq('routes.origin', origin)
        .eq('routes.destination', destination);
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte('departure_time', startDate.toISOString())
        .lt('departure_time', endDate.toISOString());
    }

    const { data, error } = await query.order('departure_time', { ascending: true });

    if (error) throw error;

    res.json({ schedules: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        routes (origin, destination, distance_km),
        buses (bus_number, plate_number, total_seats, bus_operators (company_name))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ schedule: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getScheduleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    // Get schedule with bus info
    const { data: schedule, error: schedError } = await supabase
      .from('schedules')
      .select('*, buses (id, total_seats)')
      .eq('id', id)
      .single();

    if (schedError) throw schedError;

    // Get all seats for this bus
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .eq('bus_id', schedule.buses.id);

    if (seatsError) throw seatsError;

    // Get booked seats for this schedule
    const { data: bookings, error: bookError } = await supabase
      .from('bookings')
      .select('seat_id')
      .eq('schedule_id', id)
      .in('booking_status', ['confirmed', 'pending']);

    if (bookError) throw bookError;

    const bookedSeatIds = bookings.map(b => b.seat_id);

    const availableSeats = seats.map(seat => ({
      ...seat,
      is_booked: bookedSeatIds.includes(seat.id)
    }));

    res.json({
      schedule_id: id,
      total_seats: schedule.buses.total_seats,
      available_seats: schedule.available_seats,
      seats: availableSeats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { route_id, bus_id, departure_time, arrival_time, price } = req.body;

    // Get bus total seats
    const { data: bus } = await supabase
      .from('buses')
      .select('total_seats')
      .eq('id', bus_id)
      .single();

    const { data, error } = await supabase
      .from('schedules')
      .insert([{
        route_id,
        bus_id,
        departure_time,
        arrival_time,
        price,
        available_seats: bus.total_seats,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Schedule created', schedule: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Schedule updated', schedule: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('schedules')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Schedule cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
