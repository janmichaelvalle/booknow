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

export default app
