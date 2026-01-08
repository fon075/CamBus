const supabase = require('../config/supabase');

exports.getAllOperators = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bus_operators')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    res.json({ operators: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOperatorById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('bus_operators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ operator: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createOperator = async (req, res) => {
  try {
    const { user_id, company_name, company_email, company_phone, license_number } = req.body;

    const { data, error } = await supabase
      .from('bus_operators')
      .insert([{ 
        user_id, 
        company_name, 
        company_email, 
        company_phone, 
        license_number,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Bus operator created', operator: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('bus_operators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Operator updated', operator: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('bus_operators')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Operator deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
