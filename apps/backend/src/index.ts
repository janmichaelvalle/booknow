import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono() // instansiate the server

// declare middlewares
// CORS should be called before the route
app.use('*', cors({
  origin: 'http://localhost:5173',
}))
// app.use(
//   '/api2/*',
//   cors({
//     origin: 'http://example.com',
//     allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
//     allowMethods: ['POST', 'GET', 'OPTIONS'],
//     exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
//     maxAge: 600,
//     credentials: true,
//   })
// )


// const welcomeStrings = [
//   'Hello Hono!',
//   'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
// ]

app.get('/', (c) => {
  return c.json({
    message: "Hello, world"
  })
})

app.get('/api', (c) => {
  return c.json({
    message: "Hello, world"
  })
})

interface Package {
  name: string
  description: string
}

interface Reservation {
  id: string
  date: Date
  guestsNumber: number
  packageDetails: Package
}

// Save everything in memory, think of it as DB
const reservations: Reservation[] = [

]

app.get('/api/reservations', (c) => {
  // error handling

  return c.json({
    message: "success",
    data: reservations
  })
})

app.post('/api/reservation', async (c) => {
  const body = await c.req.json()

  const { date, guestsNumber, packageDetails } = body as Reservation;

  const newReservation = {
    id: String(Date.now()),
    date,
    guestsNumber,
    packageDetails
  }

  reservations.push(newReservation)

  return c.json({
    message: "New reservation added",
    createdReservationId: newReservation.id
  })
})

export default app
