import { Hono } from 'hono'
import { cors } from 'hono/cors'



const app = new Hono()


app.get('/api/health', (c) => c.json({ ok: true })) // Confirm if backend is live


app.use('*', cors({ origin: 'http://localhost:5173' })) // middleware for all routes (* means every path).

type SelectedPackage = 'classic' | 'vintage'

type Reservation = {
    id: string
    eventDate: string
    guestCount: number
    selectedPackage: SelectedPackage
}

const reservations: Reservation[] = [] // array of Reservation objects


/* (c) explainer
(c) => ... is the handler function.
c means context (from Hono). Think of it as a “request + response toolbox”.

Inside c, you can do things like:
c.req -> read request data (body, query, params, headers)
c.json(...) -> return JSON response
c.text(...) -> return plain text
c.status(...) -> set status code

*/


app.get('/api/reservations', (c) => {
    console.log('GET length:', reservations.length, reservations)
    return c.json({
        message: "success",
        data: reservations
    })
})


app.post('/api/reservations', async (c) => {
    const body = await c.req.json()

    const newReservation: Reservation = {
        id: crypto.randomUUID(),
        eventDate: String(body.eventDate),
        guestCount: Number(body.guestCount),
        selectedPackage: body.selectedPackage as SelectedPackage,
    }

    
    reservations.push(newReservation)
    console.log('POST length:', reservations.length, newReservation)



    return c.json(
        {
            message: 'Reservation created successfully',
            data: newReservation,
        },
        201
    )
})


export default app
