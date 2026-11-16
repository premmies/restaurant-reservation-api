const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getReservations, getReservation, updateReservation, deleteReservation } = require('../controllers/reservations');
router.use(protect);
router.get('/', getReservations);
router.get('/:id', getReservation);
router.put('/:id', updateReservation);
router.delete('/:id', deleteReservation);
module.exports = router;
