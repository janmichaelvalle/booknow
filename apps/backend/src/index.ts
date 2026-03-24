import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))

if (!process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be defined')
}
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL must be defined')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be defined')
}

app.use('*', cors({ origin: process.env.CORS_ORIGIN }))

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

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

// High-level flow

// 1. Client sends a request to /api/login including the credentails (user & pass)
// 2. /api/login validates the credentials:
//  - if valid, respond back with token
//  - if invalid, respond with error (401)
// 3. Client saves the token
// 4. Private api routes are now guarded:
//  - Client must always pass a VALID token, if invalid, respond back with (401)

app.post('/api/login', async (c) => {
  const body = await c.req.json() // take the incoming request, read as json, and store it in body
  const email = body.email
  const password = body.password

  if (!email || !password) {
    return c.json({ message: 'Email and password are required' }, 400)
  }

  // const { data: row, error } = await supabase
  //   .from('users')
  //   .select('id,email,password_hash')
  //   .eq('email', email)
  //   .maybeSingle()

  // .rpc calls the database function
  const { data: row, error } = await supabase.rpc('verify_login', {
    user_email: email,
    user_password: password,
  })

  if (error) {
    return c.json({ message: 'Login failed', error: error.message }, 500)
  }

  if (!row || row.length === 0) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }


  return c.json({
    message: 'Login request received',
    token: 'some-token',
    user: row[0],
  })
})

// GET all reservations
app.get('/api/reservations', async (c) => {
  const { data: rows, error } = await supabase
    .from('reservations')
    .select('id,event_date,guest_count,selected_package')
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ message: 'Failed to fetch reservations', error: error.message }, 500)
  }

  const reservations: Reservation[] = rows.map((row) => ({
    id: row.id,
    eventDate: row.event_date,
    guestCount: row.guest_count,
    selectedPackage: row.selected_package,
  }))

  return c.json({
    message: 'success',
    data: reservations,
  })
})

// Get reservation 
app.get('/api/reservations/:reservationNo', async (c) => {
  const reservationNo = c.req.param('reservationNo')
  const { data: row, error } = await supabase
    .from('reservations')
    .select('id,event_date,guest_count,selected_package')
    .eq('id', reservationNo)
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


// Create a reservation
app.post('/api/reservations', async (c) => {
  const body = await c.req.json()

  const payload = {
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
app.put('/api/reservations/:reservationNo', async (c) => {

  // Read the reservationNo param in the url
  const reservationNo = c.req.param('reservationNo')
  // Read the incoming json
  const body = await c.req.json()
  
  // Create payload from body
  const payload = {
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
    // Update the row whose id matches reservationNo
    .eq('id', reservationNo)
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
