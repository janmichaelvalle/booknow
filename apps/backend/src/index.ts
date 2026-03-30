import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { supabase } from '../lib/supabase.js'
import reservationRoutes from '../routes/reservation.routes.js'

const app = new Hono()


const corsOrigin = process.env.CORS_ORIGIN

if (!corsOrigin) {
  throw new Error('CORS_ORIGIN must be defined')
}

app.use('*', cors({ origin: corsOrigin }))

app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/', reservationRoutes)




type SelectedPackage = 'classic' | 'vintage'

type Reservation = {
  id: string
  eventDate: string
  guestCount: number
  selectedPackage: SelectedPackage
}

type ReservationRow = {
  id: string
  event_date: string
  guest_count: number
  selected_package: SelectedPackage
}


// Edit quotation
app.put('/api/businesses/:businessSlug/reservation/:reservationId', async (c) => {

  // Read the reservationId param in the url
  const reservationId = c.req.param('reservationId')
  // Read the incoming json
  const body = await c.req.json()

  const businessSlug = c.req.param('businessSlug')

  const { business, error: businessError } = await getBusinessBySlug(businessSlug)

  if (businessError) {
    return c.json({ message: 'Failed to fetch business', error: businessError.message }, 500)
  }

  if (!business) {
    return c.json({ message: 'Business not found' }, 404)
  }

  // Create payload from body
  const payload = {
    business_id: business.id,
    event_date: String(body.eventDate),
    guest_count: Number(body.guestCount),
    selected_package: body.selectedPackage as SelectedPackage,
  }

  // rows contains the updated row data & error contains the error if the query fails
  const { data: rows, error } = await supabase
    // Use the reservations table for the query
    .from('reservations')
    // Update the row with the new values from payload
    .update(payload)
    // Update the row whose id matches reservationId
    .eq('id', reservationId)
    // Upddate the row whose business_id matches
    .eq('business_id', business.id)
    // Return these columns from the updated row
    .select('id,event_date,guest_count,selected_package')
  // This will return the new updated data and error is any

  if (error) {
    return c.json({ message: 'Failed to update reservation', error: error.message }, 500)
  }

  // If there are no returned rows, treat it as not found.
  if (!rows?.length) {
    return c.json({ message: 'Reservation not found' }, 404)
  }

  /* After the update, Supabase returns an array of rows. Since it is just one reservation, it will just have one row
  */
  const updatedData = rows[0] as ReservationRow

  // Creates a new object in a frontend friendly 
  const updatedReservation: Reservation = {
    id: updatedData.id,
    eventDate: updatedData.event_date,
    guestCount: updatedData.guest_count,
    selectedPackage: updatedData.selected_package,
  }

  return c.json({
    message: 'Reservation updated successfully',
    data: updatedReservation,
  })
})


export default app
