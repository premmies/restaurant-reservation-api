const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getRestaurants, createReservation } = require('../controllers/restaurants');

router.get('/', getRestaurants);
router.post('/:restaurantId/reservations', protect, createReservation);

module.exports = router;
