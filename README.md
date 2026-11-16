# Restaurant Reservation

Project #5 database foundation. REST API backend only; no frontend required. Routes and authentication endpoints are not implemented yet.

## Setup

Run npm install. Copy config/config.env.example to config/config.env and set MONGO_URI to YOUR MongoDB Atlas cluster connection string. Then run npm run db:setup.
The connection uses the restaurant_reservation database. Setup creates collections and indexes without deleting data. Real credentials are ignored by Git.

## Collections

- users: name, telephone (tel), unique email, hashed password, user/admin role.
- restaurants: name, address, telephone (tel), openTime and closeTime in 24-hour HH:mm format (restaurant local time).
- reservations: user and restaurant references, reservationDate, tables (whole number from 1 to 3), timestamps.

The table limit is currently interpreted as 1-3 tables per reservation. Any total limit across a user's reservations must be implemented in the future API after confirming the assignment's intent.

Use validated document save/create for writes. Query updates require runValidators: true. References do not enforce foreign keys: future handlers must check referenced users and restaurants exist. Opening hours and availability must also be checked by future handlers.

Future API: registration with name, tel, email and password; login/logout; restaurant list; create/view/edit/delete own reservations; admins can view/edit/delete any reservation. Public registration must not allow selecting admin. These permissions are not implemented by database models alone.

## Authentication (requirements 1 and 2)

Run npm start (or npm run dev) from this folder. Default port: 5001, configured in config/config.env. JWT_SECRET must be a private random value; JWT_EXPIRE=30d and JWT_COOKIE_EXPIRE=30 follow VacQ.

- POST http://localhost:5001/api/v1/auth/register ? JSON name, tel, email, password. Returns 200 with JWT and HTTP-only token cookie. Public registration always creates a user.
- POST http://localhost:5001/api/v1/auth/login ? JSON email, password. Returns the same token response.
- GET http://localhost:5001/api/v1/auth/me ? Authorization: Bearer TOKEN.
- GET http://localhost:5001/api/v1/auth/logout ? Authorization: Bearer TOKEN; replaces the token cookie, following VacQ. Previously issued bearer JWTs remain valid until expiration; remove the token from Postman after logout.

Import postman/restaurant-auth.postman_collection.json into Postman. Change email for each new registration; registration/login automatically save token for the protected requests. Set Body to raw JSON for POST requests. The API uses Express, Mongoose, bcryptjs, jsonwebtoken, cookie-parser, rate limiting and Mongo sanitization as in VacQ. No reservation endpoints are included yet.
