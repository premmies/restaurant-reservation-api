# Restaurant Reservation

Project #5 database foundation. REST API backend only; no frontend required. Requirements 1-6 are implemented: authentication, restaurant listing and creating, viewing, editing and deleting your own reservations.

## Setup

Run npm install. Copy config/config.env.example to config/config.env and set MONGO_URI to YOUR MongoDB Atlas cluster connection string. Then run npm run db:setup.
The connection uses the restaurant_reservation database. Setup creates collections and indexes without deleting data. Real credentials are ignored by Git.

## Collections

- users: name, telephone (tel), unique email, hashed password, user/admin role.
- restaurants: name, address, telephone (tel), openTime and closeTime in 24-hour HH:mm format (restaurant local time).
- reservations: user and restaurant references, reservationDate, tables (whole number from 1 to 3), timestamps.

The table limit is currently interpreted as 1-3 tables per reservation. Any total limit across a user's reservations must be implemented in the future API after confirming the assignment's intent.

Use validated document save/create for writes. Query updates require runValidators: true. The reservation endpoint checks that the selected restaurant exists and takes ownership from the authenticated user. Time-slot availability is outside the date-only reservation contract.

Remaining requirements: admin access to all reservations (7-9). Public registration always creates a regular user.

## Authentication (requirements 1 and 2)

Run npm start (or npm run dev) from this folder. Default port: 5001, configured in config/config.env. JWT_SECRET must be a private random value; JWT_EXPIRE=30d and JWT_COOKIE_EXPIRE=30 follow VacQ.

- POST http://localhost:5001/api/v1/auth/register ? JSON name, tel, email, password. Returns 200 with JWT and HTTP-only token cookie. Public registration always creates a user.
- POST http://localhost:5001/api/v1/auth/login ? JSON email, password. Returns the same token response.
- GET http://localhost:5001/api/v1/auth/me ? Authorization: Bearer TOKEN.
- GET http://localhost:5001/api/v1/auth/logout ? Authorization: Bearer TOKEN; replaces the token cookie, following VacQ. Previously issued bearer JWTs remain valid until expiration; remove the token from Postman after logout.

Import postman/restaurant-auth.postman_collection.json into Postman. Change email for each new registration; registration/login automatically save token for the protected requests. Set Body to raw JSON for POST requests. The API uses Express, Mongoose, bcryptjs, jsonwebtoken, cookie-parser, rate limiting and Mongo sanitization as in VacQ. Reservation routes are documented below.

## Requirement 3

GET http://localhost:5001/api/v1/restaurants returns names, addresses, telephone numbers and opening/closing times.

POST http://localhost:5001/api/v1/restaurants/:restaurantId/reservations requires a Bearer token and JSON `{ "reservationDate": "2026-12-01", "tables": 2 }`. Dates must be valid YYYY-MM-DD calendar dates; tables must be a whole number from 1 through 3 per reservation. The authenticated user owns the reservation regardless of any user field in the request. Unknown restaurants return 404; invalid input returns 400.

The assignment specifies a date, so this endpoint does not schedule time slots or enforce opening hours/capacity. The three-table limit applies per reservation, as in the original model.

Run npm run db:seed-demo to add one clearly labeled fictional restaurant for Postman testing without replacing existing restaurants. Run List restaurants before Create reservation in the imported collection; the restaurant ID is saved automatically.

Run npm run test:reservations to verify against Atlas using temporary records which are removed afterward.

## Requirements 4-6

All routes below require Authorization: Bearer TOKEN and restrict records to the logged-in owner. Another user's ID returns 404, as does a nonexistent reservation. Invalid IDs return 400. No admin override is implemented yet.

- GET /api/v1/reservations: list your reservations with restaurant details.
- GET /api/v1/reservations/:id: view one of your reservations.
- PUT /api/v1/reservations/:id: edit reservationDate (YYYY-MM-DD), tables (integer 1-3), and/or restaurant (existing restaurant ID). Omitted fields stay unchanged. Empty bodies and fields such as user or _id are rejected.
- DELETE /api/v1/reservations/:id: delete your reservation; returns 200 with an empty data object.

Reimport the Postman collection. Run Login, List restaurants, Create reservation, My reservations, Get my reservation, Edit my reservation, then Delete my reservation. Creation automatically saves reservationId. Deletion removes that reservation from Atlas.

Run npm run test:own-reservations for the live ownership and edit/delete checks. Test fixtures are cleaned up afterward.
