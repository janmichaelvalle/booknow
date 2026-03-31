import { Hono } from 'hono'
import { cors } from 'hono/cors'
import reservationRoutes from '../routes/reservation.routes.js'
import paymentMethodRoutes from '../routes/payment-method.routes.js'

const app = new Hono()


const corsOrigin = process.env.CORS_ORIGIN

if (!corsOrigin) {
  throw new Error('CORS_ORIGIN must be defined')
}

app.use('*', cors({ origin: corsOrigin }))

app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/', reservationRoutes)
app.route('/', paymentMethodRoutes)


export default app
