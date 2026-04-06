import { Hono } from 'hono'
import { cors } from 'hono/cors'
import reservationRoutes from '../routes/reservation.routes.js'
import paymentMethodRoutes from '../routes/payment-method.routes.js'
import { businessMiddleware } from "../middlewares/business.middleware.js";


const app = new Hono()


const corsOrigin = process.env.CORS_ORIGIN

if (!corsOrigin) {
  throw new Error('CORS_ORIGIN must be defined')
}

app.use('*', cors({ origin: corsOrigin }))
// Example flow for middleware:
// 1. do the logic + some validations
// 2. assuming there's no error, attach the returned value to context (Override Context global types)
// 3. Retrieve the new value attached to Context from controllers 
// app.use("*", businessSlug())
app.use('/api/businesses/:businessSlug/*', businessMiddleware)


app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/', reservationRoutes)
app.route('/', paymentMethodRoutes)


export default app
