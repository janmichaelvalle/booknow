import { Hono } from "hono";
import { getReservationsByBusinessSlug } from "../services/reservation.service.js";


const app = new Hono()

// GET all reservations
app.get(`/api/businesses/:businessSlug/reservations`, async (c) => {
  // Read the businessSlug in the URL
  const businessSlug = c.req.param('businessSlug')
  const result = await getReservationsByBusinessSlug(businessSlug)
  if ("error" in result) {
    return c.json(
      {
        message: result.error.message,
        error: result.error.details,
      },
      result.error.status
    );
  }
  return c.json({
    message: 'success',
    data: result.data,
  })
})

// Get a reservation
app.get('/api/businesses/:businessSlug/reservation/:reservationId', async (c) => {
  const reservationId = c.req.param('reservationId')
   
  // Read the businessSlug in the URL
  const businessSlug = c.req.param('businessSlug')

  // Call getBusinessBySlug helper function
  const { business, error: businessError } = await getBusinessBySlug(businessSlug)

  if (businessError) {
    return c.json({ message: 'Failed to fetch business', error: businessError.message }, 500)
  }

  if (!business) {
    return c.json({ message: 'Business not found' }, 404)
  }


  const { data: row, error } = await supabase
    .from('reservations')
    .select('id,event_date,guest_count,selected_package')
    .eq('id', reservationId)
    .eq('business_id', business.id)
    .maybeSingle()

  if (error) {
    return c.json({ message: 'Failed to fetch reservation', error: error.message }, 500)
  }

  if (!row) {
    return c.json({ message: 'Reservation not found' }, 404)
  }

  const reservation: Reservation = {
    id: row.id,
    eventDate: row.event_date,
    guestCount: row.guest_count,
    selectedPackage: row.selected_package,
  }

  return c.json({ message: 'success', data: reservation })
})

export default app