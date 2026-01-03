const supabase = require('../config/supabase');

exports.getAllRoutes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('is_active', true)
      .order('origin', { ascending: true });

    if (error) throw error;

    res.json({ routes: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRouteById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ route: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    const { origin, destination, distance_km, estimated_duration_hours, base_price } = req.body;

    const { data, error } = await supabase
      .from('routes')
      .insert([{ origin, destination, distance_km, estimated_duration_hours, base_price }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Route created', route: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Route updated', route: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('routes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Route deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};