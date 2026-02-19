import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { type Reservation } from "@/lib/types"



export function ReservationsListPage () {

    const [reservations, setReservations] = useState<Reservation[]>([])

     useEffect(() => {
    // async means that the function will do something that takes time
    async function loadReservations() {
    // awat means pause this function here until fetch finishes
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/reservations`)
    const json = await res.json()
    setReservations(json.data)
    
  }

  loadReservations()
}, [])

    return (
        <>
        <h1>All Reservations</h1>
        <Table>
      <TableCaption>A list of your all reservations</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Event Date</TableHead>
          <TableHead>Guest Count</TableHead>
          <TableHead>Package</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <TableRow key={reservation.id}>
            <TableCell>{reservation.id}</TableCell>
             <TableCell>{reservation.eventDate}</TableCell>
            <TableCell>{reservation.guestCount}</TableCell>
            <TableCell>{reservation.selectedPackage}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
        </>
    )

}



