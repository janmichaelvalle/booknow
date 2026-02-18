import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { Button } from "@/components/ui/button"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect } from "react";
import { type QuotationValues } from "@/lib/types"



const quotationSchema = z.object({
  eventDate: z.date(),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  selectedPackage: z.enum(["classic", "vintage"]),
})


export function QuotationPage() {

  const navigate = useNavigate()
  const location = useLocation()

  const incoming = location.state as QuotationValues | undefined   // This is the values coming from reservation page when user wants to edit

   const form = useForm<z.infer<typeof quotationSchema>>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      eventDate: undefined,
      guestCount: undefined,
      selectedPackage: "classic",
    },
  })

  
  useEffect(() => {
  if (incoming) {
    form.reset({
      eventDate: new Date(incoming.eventDate),
      guestCount: incoming.guestCount,
      selectedPackage: incoming.selectedPackage,
    })
  }
}, [incoming, form])



    const classicPackagePrice = form.watch("guestCount") * 50
    const vintagePackagePrice = form.watch("guestCount") * 100

  async function onSubmit(data: z.infer<typeof quotationSchema>) {
    
    const selectedPackagePrice =
    data.selectedPackage === "classic"
      ? classicPackagePrice
      : vintagePackagePrice
    
    const payload = {
      eventDate: data.eventDate.toISOString(),
      guestCount: data.guestCount,
      selectedPackage: data.selectedPackage,
    }

    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
    console.error("Failed to create reservation")
    return
  }

    navigate("/reservation", { state: {
      ...data, selectedPackagePrice
    } })
  }




  return (
    <>
      <h1>This is the quotation page</h1>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <EventDetails
          control={form.control}
        />
        <PackageDetails
          control={form.control}
          classicPackagePrice={classicPackagePrice}
          vintagePackagePrice={vintagePackagePrice}
        />

        <h1>Summary</h1>
        <p>
          Event date:{" "}
          {form.watch("eventDate") ? form.watch("eventDate").toLocaleDateString() : "Not selected"}
        </p>
        <p>Guests: {form.watch("guestCount")}</p>
        <p>Package: {form.watch("selectedPackage") || "None selected"}</p>
        <p>
          {(form.watch("guestCount") ?? 0) &&
            (form.watch("selectedPackage") === "classic"
              ? classicPackagePrice
              : vintagePackagePrice)}
        </p>

        <Button type="submit">Generate Quotation</Button>
      </form>
    </>


  )

}