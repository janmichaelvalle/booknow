import { Hono } from "hono";
import { getAllReservationsController, getSingleReservationController, createReservationController } from "../controllers/reservation.controller.js";


const app = new Hono()

// GET all reservations
app.get("/api/businesses/:businessSlug/reservations", getAllReservationsController);

// Get single reservation
app.get('/api/businesses/:businessSlug/reservation/:reservationId', getSingleReservationController);

// Create reservation
app.post('/api/businesses/:businessSlug/reservation', createReservationController);

// app.post('/api/reservations', async (c) => {

//   const { business, error: businessError } = await getBusinessBySlug(businessSlug)

//     if (!business) {
//     return c.json({ message: 'Business not found' }, 400)
//   }

//   if (businessError) {
//     return c.json({ message: 'Failed to fetch business', error: businessError.message }, 500)
//   }


//   const payload = {
//     business_id: business.id,
//     event_date: String(body.eventDate),
//     guest_count: Number(body.guestCount),
//     selected_package: body.selectedPackage as SelectedPackage,
//   }

//   const { data: rows, error } = await supabase
//     .from('reservations')
//     .insert(payload)
//     .select('id,event_date,guest_count,selected_package')

//   if (error || !rows?.length) {
//     return c.json(
//       { message: 'Failed to create reservation', error: error?.message ?? 'No row returned' },
//       500
//     )
//   }

//   const inserted = rows[0] as ReservationRow
//   const newReservation: Reservation = {
//     id: inserted.id,
//     eventDate: inserted.event_date,
//     guestCount: inserted.guest_count,
//     selectedPackage: inserted.selected_package,
//   }

//   return c.json(
//     {
//       message: 'Reservation created successfully',
//       data: newReservation,
//     },
//     201
//   )
// })

export default app