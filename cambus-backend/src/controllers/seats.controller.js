const supabase = require('../config/supabase');

exports.getSeatsByBus = async (req, res) => {
  try {
    const { busId } = req.params;

    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('bus_id', busId)
      .order('seat_number', { ascending: true });

    if (error) throw error;

    res.json({ seats: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

