import { Hono } from "hono";
import { getAllReservationsController, getSingleReservationController, createReservationController, updateReservationController, updateReservationStatusController} from "../controllers/reservation.controller.js";



const app = new Hono()

// GET all reservations
app.get("/api/businesses/:businessSlug/reservations", getAllReservationsController);

// Get single reservation
app.get('/api/businesses/:businessSlug/reservation/:reservationId', getSingleReservationController);

// Create reservation
app.post('/api/businesses/:businessSlug/reservation', createReservationController);

// Edit reservation
app.put('/api/businesses/:businessSlug/reservation/:reservationId', updateReservationController)

// Accept reservation
app.put('/api/businesses/:businessSlug/reservation/:reservationId/status', updateReservationStatusController )

export default app