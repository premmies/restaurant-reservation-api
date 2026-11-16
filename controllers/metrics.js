const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');

exports.getReservationMetrics = async (req, res) => {
  const { startDate, endDate, status, limit } = req.query;

  const matchStage = {};
  if (status) matchStage.status = status;

  if (startDate || endDate) {
    matchStage.reservationDate = {};
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (Number.isNaN(parsedStart.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid startDate' });
      }
      matchStage.reservationDate.$gte = parsedStart;
    }
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (Number.isNaN(parsedEnd.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid endDate' });
      }
      matchStage.reservationDate.$lte = parsedEnd;
    }
  }

  // Ensure limit is a positive integer (MongoDB $limit throws an error on 0 or negative numbers)
  const parsedLimit = parseInt(limit, 10);
  const topLimit = parsedLimit > 0 ? parsedLimit : 10;

  const [metrics] = await Reservation.aggregate([
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $facet: {
        totalReservations: [{ $count: 'count' }],
        reservationsPerDay: [
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$reservationDate',
                  timezone: 'UTC'
                }
              },
              reservationCount: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ],
        peakBookingHours: [
          {
            $group: {
              _id: { $hour: { date: '$createdAt', timezone: 'UTC' } },
              reservationCount: { $sum: 1 }
            }
          },
          { $sort: { reservationCount: -1, _id: 1 } }
        ],
        mostPopularRestaurants: [
          { $group: { _id: '$restaurant', reservationCount: { $sum: 1 } } },
          { $sort: { reservationCount: -1, _id: 1 } },
          { $limit: topLimit },
          {
            $lookup: {
              from: Restaurant.collection.name,
              localField: '_id',
              foreignField: '_id',
              as: 'restaurant'
            }
          },
          { $unwind: '$restaurant' },
          {
            $project: {
              _id: 0,
              restaurantId: '$_id',
              restaurantName: '$restaurant.name',
              reservationCount: 1
            }
          }
        ]
      }
    }
  ]);

  const total = metrics.totalReservations[0];
  res.status(200).json({
    success: true,
    data: {
      totalReservations: total ? total.count : 0,
      reservationsPerDay: metrics.reservationsPerDay,
      peakBookingHours: metrics.peakBookingHours.map(({ _id, reservationCount }) => ({
        hourUtc: _id,
        reservationCount
      })),
      mostPopularRestaurants: metrics.mostPopularRestaurants
    }
  });
};