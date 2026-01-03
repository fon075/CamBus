const supabase = require('../config/supabase');

exports.getAllBuses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buses')
      .select(`
        *,
        bus_operators (
          company_name,
          company_phone
        )
      `)
      .eq('is_active', true);

    if (error) throw error;

    res.json({ buses: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBusById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('buses')
      .select(`
        *,
        bus_operators (
          company_name,
          company_phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ bus: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createBus = async (req, res) => {
  try {
    const { operator_id, bus_number, plate_number, bus_type, total_seats, amenities } = req.body;

    // Create bus
    const { data: busData, error: busError } = await supabase
      .from('buses')
      .insert([{ operator_id, bus_number, plate_number, bus_type, total_seats, amenities }])
      .select()
      .single();

    if (busError) throw busError;

    // Create seats for this bus
    const seats = [];
    for (let i = 1; i <= total_seats; i++) {
      seats.push({
        bus_id: busData.id,
        seat_number: `${i}`,
        seat_type: 'standard',
        is_available: true
      });
    }

    const { error: seatsError } = await supabase
      .from('seats')
      .insert(seats);

    if (seatsError) throw seatsError;

    res.status(201).json({ message: 'Bus created with seats', bus: busData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('buses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Bus updated', bus: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBus = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('buses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Bus deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

