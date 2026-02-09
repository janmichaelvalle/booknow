import { useState } from "react";

import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { Button } from "@/components/ui/button"





export function QuotationPage() {
  // Syntax: const [value, setValue] = useState(initialValue)
  const [eventDate, setEventDate] = useState<Date | undefined>()   // <Date | undefined>() is typscript
  const [guestCount, setGuestCount] = useState<number>(0)
  const [selectedPackage, setSelectedPackage] = useState('')

  console.log("QuotationPage state:", { eventDate, guestCount, selectedPackage })

  let classicPackagePrice = guestCount * 50
  let vintagePackagePrice = guestCount * 100

  return (
    <>
      <h1>This is the quotation page</h1>
      <EventDetails
        eventDate={eventDate}
        guestCount={guestCount}
        onEventDateChange={setEventDate}
        onGuestCountChange={setGuestCount}
      />
      <PackageDetails
        classicPackagePrice={classicPackagePrice}
        vintagePackagePrice={vintagePackagePrice}
        selectedPackage={selectedPackage}
        onPackageChange={setSelectedPackage} />

      <h1>Summary</h1>
      <p>
        Event date:{" "}
        {eventDate ? eventDate.toLocaleDateString() : "Not selected"}
      </p>
      <p>Guests: {guestCount}</p>
      <p>Package: {selectedPackage || "None selected"}</p>

      <Button>Generate Quotation</Button>

    </>


  )

}