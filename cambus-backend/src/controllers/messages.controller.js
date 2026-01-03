const supabase = require('../config/supabase');

exports.sendMessage = async (req, res) => {
  try {
    const { receiver_id, booking_id, subject, message } = req.body;

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        receiver_id,
        booking_id,
        subject,
        message,
        sender_role: req.user.role
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Message sent', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserMessages = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (full_name, email),
        receiver:users!messages_receiver_id_fkey (full_name, email)
      `)
      .or(`sender_id.eq.${req.user.id},receiver_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ messages: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .eq('receiver_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Marked as read', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

