import {Routes, Route} from "react-router-dom"
import { QuotationPage } from "./pages/QuotationPage"
import { ReservationPage } from "./pages/ReservationPage"


function App() {


  return (
     <Routes>
      <Route path="/" element={<QuotationPage />} />
      <Route path="/reservation" element={<ReservationPage />} />
    </Routes>
  )
}

export default App
