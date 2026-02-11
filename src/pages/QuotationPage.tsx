import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { Button } from "@/components/ui/button"

import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"



const quotationSchema = z.object({
  eventDate: z.date(),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  selectedPackage: z.enum(["classic", "vintage"]),
})


export function QuotationPage() {

  let navigate = useNavigate()

  const form = useForm<z.infer<typeof quotationSchema>>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      eventDate: undefined,
      guestCount: undefined,
      selectedPackage: "classic",
    },
  })

    const classicPackagePrice = form.watch("guestCount") * 50
    const vintagePackagePrice = form.watch("guestCount") * 100

  function onSubmit(data: z.infer<typeof quotationSchema>) {
    
    const selectedPackagePrice =
    data.selectedPackage === "classic"
      ? classicPackagePrice
      : vintagePackagePrice

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