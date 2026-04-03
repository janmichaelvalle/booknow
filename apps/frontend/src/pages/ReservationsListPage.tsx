
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { type Reservation } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"
import useAuth from "@/context/useAuth"
import { useNavigate, useParams, Link } from "react-router-dom"



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

  const navigate = useNavigate();
  const { businessSlug } = useParams()

  async function fetchReservations(): Promise<Reservation[]> {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservations`)
    const data = await res.json()
    return data.data
  }

  const { data: reservations, isPending } = useQuery({
    queryKey: ['reservations', businessSlug],
    queryFn: fetchReservations,
    initialData: []
  });

  if (isPending) return 'Loading...'

  const { logout } = useAuth()

  // Handler functions are used when we want to do multiple things for one user event.
  async function handleLogout() {
    console.log("Pressed logout")
    await logout()
    navigate("/login")

  }

  if (!businessSlug) {
    return <p>Missing business slug.</p>
  }



  return (
    <>
      <h1>All Reservations</h1>
      <Table>
        <TableCaption>A list of your all reservations</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Event Date</TableHead>
            <TableHead>Guest Count</TableHead>
            <TableHead>Package</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>
                <Link to={`/${businessSlug}/reservation/${reservation.id}`}>
                  {reservation.id}
                </Link>
              </TableCell>
              <TableCell>{reservation.reservationStatus}</TableCell>
              <TableCell>{reservation.eventDate}</TableCell>
              <TableCell>{reservation.guestCount}</TableCell>
              <TableCell>{reservation.selectedPackage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" onClick={
        handleLogout

      }>Logout</Button>
    </>
  )

}



