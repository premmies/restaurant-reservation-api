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
