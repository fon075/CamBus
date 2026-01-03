const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('admin'), adminController.getDashboard);
router.get('/bookings', authenticate, authorize('admin', 'operator'), adminController.getAllBookings);
router.get('/analytics', authenticate, authorize('admin'), adminController.getAnalytics);

module.exports = router;


// ========================================
// FILE: src/controllers/admin.controller.js
// ========================================
const supabase = require('../config/supabase');

exports.getDashboard = async (req, res) => {
  try {
    // Total bookings
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    // Total revenue
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success');

    const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

    // Active schedules
    const { count: activeSchedules } = await supabase
      .from('schedules')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled');

    // Recent bookings
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        *,
        schedules (
          routes (origin, destination),
          buses (bus_operators (company_name))
        ),
        users (full_name, phone_number)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      dashboard: {
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        active_schedules: activeSchedules,
        recent_bookings: recentBookings
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        schedules (
          departure_time,
          routes (origin, destination),
          buses (bus_number, bus_operators (company_name))
        ),
        users (full_name, phone_number, email)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ bookings: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // Bookings by route
    const { data: routeStats } = await supabase
      .from('bookings')
      .select(`
        schedule_id,
        schedules (
          routes (origin, destination)
        )
      `)
      .eq('booking_status', 'confirmed');

    // Revenue by month
    const { data: monthlyRevenue } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'success');

    res.json({
      analytics: {
        route_stats: routeStats,
        monthly_revenue: monthlyRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
