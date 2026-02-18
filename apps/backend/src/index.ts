import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'



const app = new Hono()


app.get('/api/health', (c) => c.json({ ok: true })) // Confirm if backend is live

if (!process.env.CORS_ORIGIN) {
    throw new Error("CORS_ORIGIN must be defined");
}

app.use('*', cors({ origin: process.env.CORS_ORIGIN })) // middleware for all routes (* means every path).

type SelectedPackage = 'classic' | 'vintage'

type Reservation = {
    id: string
    eventDate: string
    guestCount: number
    selectedPackage: SelectedPackage
}

type DataStore = {
    reservations: Reservation[]
    'other-data': unknown[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataFilePath = path.resolve(__dirname, '../data.json')

async function readDataStore(): Promise<DataStore> {
    const fileContent = await readFile(dataFilePath, 'utf-8')
    const parsed = JSON.parse(fileContent) as Partial<DataStore>

    return {
        reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [],
        'other-data': Array.isArray(parsed['other-data']) ? parsed['other-data'] : [],
    }
}

async function writeDataStore(data: DataStore): Promise<void> {
    await writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8')
}


/* (c) explainer
(c) => ... is the handler function.
c means context (from Hono). Think of it as a “request + response toolbox”.

Inside c, you can do things like:
c.req -> read request data (body, query, params, headers)
c.json(...) -> return JSON response
c.text(...) -> return plain text
c.status(...) -> set status code

*/


app.get('/api/reservations', async (c) => {
    const dataStore = await readDataStore()
    console.log('GET length:', dataStore.reservations.length, dataStore.reservations)
    return c.json({
        message: "success",
        data: dataStore.reservations
    })
})


app.post('/api/reservations', async (c) => {
    const body = await c.req.json()
    const dataStore = await readDataStore()

    const newReservation: Reservation = {
        id: crypto.randomUUID(),
        eventDate: String(body.eventDate),
        guestCount: Number(body.guestCount),
        selectedPackage: body.selectedPackage as SelectedPackage,
    }

    dataStore.reservations.push(newReservation)
    await writeDataStore(dataStore)
    console.log('POST length:', dataStore.reservations.length, newReservation)



    return c.json(
        {
            message: 'Reservation created successfully',
            data: newReservation,
        },
        201
    )
})


export default app
