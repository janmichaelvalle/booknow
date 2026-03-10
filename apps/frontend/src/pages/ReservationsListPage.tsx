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
import { Link } from "react-router-dom"

import { type Reservation } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"



export function ReservationsListPage() {

  // Managing server state on our own
  // const [reservations, setReservations] = useState<Reservation[]>([])

  // useEffect(() => {
  //   // async means that the function will do something that takes time
  //   async function loadReservations() {
  //     // awat means pause this function here until fetch finishes
  //     const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/reservations`)
  //     const json = await res.json()
  //     setReservations(json.data)
  //   }

  //   loadReservations()
  // }, [])

  async function fetchReservations(): Promise<Reservation[]> {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/reservations`)
    const data = await res.json()

    return data?.data
  }

  const { data: reservations, isPending, isFetching, error} = useQuery({
    queryKey: ['reservations'],
    queryFn: fetchReservations,
    initialData: []
  });

  if (isPending) return 'Loading...'

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
              <Link to={`/reservation/${reservation.id}`}>
              <TableCell>{reservation.id}</TableCell>
              </Link>
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



