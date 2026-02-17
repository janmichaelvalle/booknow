import {Routes, Route} from "react-router-dom"
import { QuotationPage } from "./pages/QuotationPage"
import { ReservationPage } from "./pages/ReservationPage"
import { useEffect } from "react"


function App() {

  // useEffect(() => {
  //   fetch("http://localhost:3000/api/reservation", {
  //     method: "POST",
  //     headers: {
  //       type: "application/json"
  //     },
  //     body: JSON.stringify({
        
  //     })
  //   })
  //   .then((res) => res.json())
  //   .then((data) => console.log(data))
  // }, []) // initial load

  return (
     <Routes>
      <Route path="/" element={<QuotationPage />} />
      <Route path="/reservation" element={<ReservationPage />} />
    </Routes>
  )
}

export default App
