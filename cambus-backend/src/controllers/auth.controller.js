const supabase = require('../config/supabase');

exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone_number, id_number, role = 'passenger' } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !phone_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone_number,
          role
        }
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Insert user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        full_name,
        phone_number,
        email,
        id_number,
        role
      }])
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: userError.message });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      session: authData.session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      message: 'Login successful',
      user: userData,
      session: data.session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, phone_number, id_number } = req.body;

    const { data, error } = await supabase
      .from('users')
      .update({ full_name, phone_number, id_number })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile updated', user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

