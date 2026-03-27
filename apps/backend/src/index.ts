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


// Helper function to get business_slug
// async function getBusinessBySlug(slug: string) {
//   const { data, error } = await supabase
//     .from('businesses')
//     .select('id,name,slug')
//     .eq('slug', slug)
//     .maybeSingle()

//   return {
//     business: data as BusinessRow | null,
//     error,
//   }
// }


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

// type BusinessRow = {
//   id: string
//   name: string
//   slug: string
// }


// GET all reservations
// app.get(`/api/businesses/:businessSlug/reservations`, async (c) => {
  
//   // Read the businessSlug in the URL
//   const businessSlug = c.req.param('businessSlug')

//   // Call getBusinessBySlug helper function
//   const { business, error: businessError } = await getBusinessBySlug(businessSlug)

//   if (businessError) {
//     return c.json({ message: 'Failed to fetch business', error: businessError.message }, 500)
//   }

//   if (!business) {
//     return c.json({ message: 'Business not found' }, 404)
//   }


//   const { data: rows, error } = await supabase
//     .from('reservations')
//     .select('id,event_date,guest_count,selected_package')
//     .eq('business_id', business.id)
//     .order('created_at', { ascending: false })

//   if (error) {
//     return c.json({ message: 'Failed to fetch reservations', error: error.message }, 500)
//   }

//   const reservations: Reservation[] = rows.map((row) => ({
//     id: row.id,
//     eventDate: row.event_date,
//     guestCount: row.guest_count,
//     selectedPackage: row.selected_package,
//   }))

//   return c.json({
//     message: 'success',
//     data: reservations,
//   })
// })

// Get reservation 
// app.get('/api/businesses/:businessSlug/reservation/:reservationId', async (c) => {
//   const reservationId = c.req.param('reservationId')
//    // Read the businessSlug in the URL
//   const businessSlug = c.req.param('businessSlug')

//   // Call getBusinessBySlug helper function
//   const { business, error: businessError } = await getBusinessBySlug(businessSlug)

//   if (businessError) {
//     return c.json({ message: 'Failed to fetch business', error: businessError.message }, 500)
//   }

//   if (!business) {
//     return c.json({ message: 'Business not found' }, 404)
//   }


//   const { data: row, error } = await supabase
//     .from('reservations')
//     .select('id,event_date,guest_count,selected_package')
//     .eq('id', reservationId)
//     .eq('business_id', business.id)
//     .maybeSingle()

//   if (error) {
//     return c.json({ message: 'Failed to fetch reservation', error: error.message }, 500)
//   }

//   if (!row) {
//     return c.json({ message: 'Reservation not found' }, 404)
//   }

//   const reservation: Reservation = {
//     id: row.id,
//     eventDate: row.event_date,
//     guestCount: row.guest_count,
//     selectedPackage: row.selected_package,
//   }

//   return c.json({ message: 'success', data: reservation })
// })


// Create a reservation
app.post('/api/reservations', async (c) => {
  const body = await c.req.json()

  // What is ?? '' mean?
  const businessSlug = String(body.businessSlug ?? '')


  const { business, error: businessError } = await getBusinessBySlug(businessSlug)

    if (!business) {
    return c.json({ message: 'Business not found' }, 400)
  }

  if (businessError) {
    return c.json({ message: 'Failed to fetch business', error: businessError.message }, 500)
  }


  const payload = {
    business_id: business.id,
    event_date: String(body.eventDate),
    guest_count: Number(body.guestCount),
    selected_package: body.selectedPackage as SelectedPackage,
  }

  const { data: rows, error } = await supabase
    .from('reservations')
    .insert(payload)
    .select('id,event_date,guest_count,selected_package')

  if (error || !rows?.length) {
    return c.json(
      { message: 'Failed to create reservation', error: error?.message ?? 'No row returned' },
      500
    )
  }

  const inserted = rows[0] as ReservationRow
  const newReservation: Reservation = {
    id: inserted.id,
    eventDate: inserted.event_date,
    guestCount: inserted.guest_count,
    selectedPackage: inserted.selected_package,
  }

  return c.json(
    {
      message: 'Reservation created successfully',
      data: newReservation,
    },
    201
  )
})

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
