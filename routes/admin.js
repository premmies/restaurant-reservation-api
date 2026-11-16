const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getReservationMetrics } = require('../controllers/metrics');

router.get('/reservation-metrics', protect, authorize('admin'), getReservationMetrics);

module.exports = router;
