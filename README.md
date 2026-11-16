# Restaurant Reservation

Project #5 database foundation. REST API backend only; no frontend required. Requirements 1-9 are implemented: authentication, restaurant listing, user reservation management and admin reservation management.

## Setup

Run npm install. Copy config/config.env.example to config/config.env and set MONGO_URI to YOUR MongoDB Atlas cluster connection string. Then run npm run db:setup.
The connection uses the restaurant_reservation database. Setup creates collections and indexes without deleting data. Real credentials are ignored by Git.

## Collections

- users: name, telephone (tel), unique email, hashed password, user/admin role.
- restaurants: name, address, telephone (tel), openTime and closeTime in 24-hour HH:mm format (restaurant local time).
- reservations: user and restaurant references, reservationDate, tables (whole number from 1 to 3), timestamps.

The table limit is currently interpreted as 1-3 tables per reservation. Any total limit across a user's reservations must be implemented in the future API after confirming the assignment's intent.

Use validated document save/create for writes. Query updates require runValidators: true. The reservation endpoint checks that the selected restaurant exists and takes ownership from the authenticated user. Time-slot availability is outside the date-only reservation contract.

Admins may view, edit and delete any reservation. Public registration always creates a regular user.

## Authentication (requirements 1 and 2)

Run npm start (or npm run dev) from this folder. Default port: 5001, configured in config/config.env. JWT_SECRET must be a private random value; JWT_EXPIRE=30d and JWT_COOKIE_EXPIRE=30 follow VacQ.

- POST http://localhost:5001/api/v1/auth/register ? JSON name, tel, email, password. Returns 200 with JWT and HTTP-only token cookie. Public registration always creates a user.
- POST http://localhost:5001/api/v1/auth/login ? JSON email, password. Returns the same token response.
- GET http://localhost:5001/api/v1/auth/me ? Authorization: Bearer TOKEN.
- GET http://localhost:5001/api/v1/auth/logout ? Authorization: Bearer TOKEN; invalidates all JWTs issued for that account and clears the token cookie. Log in again to receive a valid token.

Import postman/restaurant-auth.postman_collection.json into Postman. Change email for each new registration; registration/login automatically save token for the protected requests. Set Body to raw JSON for POST requests. The API uses Express, Mongoose, bcryptjs, jsonwebtoken, cookie-parser, rate limiting and Mongo sanitization as in VacQ. Reservation routes are documented below.

## Requirement 3

GET http://localhost:5001/api/v1/restaurants returns names, addresses, telephone numbers and opening/closing times.

POST http://localhost:5001/api/v1/restaurants/:restaurantId/reservations requires a Bearer token and JSON `{ "reservationDate": "2026-12-01", "tables": 2 }`. Dates must be valid YYYY-MM-DD calendar dates; tables must be a whole number from 1 through 3 per reservation. The authenticated user owns the reservation regardless of any user field in the request. Unknown restaurants return 404; invalid input returns 400.

The assignment specifies a date, so this endpoint does not schedule time slots or enforce opening hours/capacity. The three-table limit applies per reservation, as in the original model.

Run npm run db:seed-demo to add one clearly labeled fictional restaurant for Postman testing without replacing existing restaurants. Run List restaurants before Create reservation in the imported collection; the restaurant ID is saved automatically.

Run npm run test:reservations to verify against Atlas using temporary records which are removed afterward.

## Requirements 4-6

All routes below require Authorization: Bearer TOKEN. Regular users are restricted to their own reservations; admins can access any reservation. Another user's ID returns 404 for regular users, as does a nonexistent reservation. Invalid IDs return 400.

- GET /api/v1/reservations: list your reservations with restaurant details.
- GET /api/v1/reservations/:id: view one of your reservations.
- PUT /api/v1/reservations/:id: edit reservationDate (YYYY-MM-DD), tables (integer 1-3), and/or restaurant (existing restaurant ID). Omitted fields stay unchanged. Empty bodies and fields such as user or _id are rejected.
- DELETE /api/v1/reservations/:id: delete your reservation; returns 200 with an empty data object.

Reimport the Postman collection. Run Login, List restaurants, Create reservation, My reservations, Get my reservation, Edit my reservation, then Delete my reservation. Creation automatically saves reservationId. Deletion removes that reservation from Atlas.

Run npm run test:own-reservations for the live ownership and edit/delete checks. Test fixtures are cleaned up afterward.

## Admin access (requirements 7-9)

Admins use the same GET /api/v1/reservations, GET /api/v1/reservations/:id, PUT /api/v1/reservations/:id and DELETE /api/v1/reservations/:id endpoints. The stored user role determines access on each request. Admins can see all reservations, edit dates/table counts/restaurants, and delete any reservation. Validation remains the same and reservation ownership cannot be changed.

To prepare your own admin account, register normally, then use Atlas Browse Collections > restaurant_reservation > users to find your account by email and change role from user to admin. Log in using that account. Public registration intentionally cannot grant admin access. No permanent admin account or password is created by tests.

In Postman, use the Admin - Requirements 7 to 9 folder. Set adminEmail and adminPassword locally, then run Admin login. Set adminReservationId to a disposable test reservation belonging to another user, then view, edit and delete it. Admin requests use adminToken separately from the normal user token. Do not commit exported credentials or tokens.

The test:own-reservations script now checks requirements 4-9, including administrator operations and role revocation.
