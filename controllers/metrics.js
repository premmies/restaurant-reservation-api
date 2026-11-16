const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');

exports.getReservationMetrics = async (req, res) => {
  const [metrics] = await Reservation.aggregate([
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
