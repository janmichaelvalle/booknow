import { Hono } from 'hono'
import { cors } from 'hono/cors'
import quotationRoutes from '../routes/quotation.routes.js'
import paymentMethodRoutes from '../routes/payment-method.routes.js'
import businessRoutes from '../routes/business.routes.js' 
import merchantRoutes from '../routes/merchant.routes.js'
import { businessMiddleware } from "../middlewares/business.middleware.js";
import { parseCorsOrigins } from "../middlewares/cors-origins.js";


const app = new Hono()


// CORS_ORIGIN remains a one-origin fallback for existing local setups.
const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN)
app.use('*', cors({ origin: (origin) => allowedOrigins.has(origin) ? origin : "" }))
// Example flow for middleware:
// 1. do the logic + some validations
// 2. assuming there's no error, attach the returned value to context (Override Context global types)
// 3. Retrieve the new value attached to Context from controllers 
// app.use("*", businessSlug())
app.use('/api/businesses/:businessSlug/*', businessMiddleware)


app.get('/api/health', (c) => c.json({ ok: true }))

app.route('/', quotationRoutes)
app.route('/', paymentMethodRoutes)
app.route('/', businessRoutes)
app.route('/', merchantRoutes)


export default app
