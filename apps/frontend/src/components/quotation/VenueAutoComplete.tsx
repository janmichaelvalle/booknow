import { useEffect, useRef } from "react"
import { importLibrary } from "@googlemaps/js-api-loader"

export type CoverageResult = {
  isCovered: boolean
  transportationFee: number | null
}

type VenueAutocompleteProps = {
  venue: string
  onVenueSelect: (
    address: string,
    coverage: CoverageResult
  ) => void
}

function normalizeAreaName(value?: string) {
  return value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function getHardcodedCoverage({ city, region }: CoverageInput) {
  const normalizedCity = normalizeAreaName(city)
  const normalizedRegion = normalizeAreaName(region)

  const metroManilaNames = [
    "metro manila",
    "national capital region",
    "ncr",
  ]

  if (
    !normalizedRegion ||
    !metroManilaNames.includes(normalizedRegion)
  ) {
    return {
      isCovered: false,
      transportationFee: null,
    }
  }

  const localityFees: Record<string, number> = {
    pasay: 500,
    "pasay city": 500,
    paranaque: 500,
    "paranaque city": 500,
  }

  return {
    isCovered: true,
    transportationFee:
      localityFees[normalizedCity ?? ""] ?? 0,
  }
}



export function VenueAutocomplete({
  venue,
  onVenueSelect,
}: VenueAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let autocompleteElement:
      | google.maps.places.PlaceAutocompleteElement
      | undefined

    async function initializeAutocomplete() {
      const { PlaceAutocompleteElement } = await importLibrary("places")

      if (cancelled || !containerRef.current) {
        return
      }

      const element = new PlaceAutocompleteElement()

      autocompleteElement = element

      element.placeholder = "Search for a venue or address"
      element.includedRegionCodes = ["ph"]
      element.style.width = "100%"
      element.value = venue

      element.addEventListener("gmp-select", async (event) => {
        const place = event.placePrediction.toPlace()

        await place.fetchFields({
  fields: [
    "id",
    "displayName",
    "formattedAddress",
    "addressComponents",
    "location",
  ],
})

const addressComponents = place.addressComponents ?? []

function getAddressComponent(type: string) {
  return addressComponents.find((component) =>
    component.types.includes(type)
  )?.longText
}

const city =
  getAddressComponent("locality") ??
  getAddressComponent("administrative_area_level_3") ??
  getAddressComponent("sublocality_level_1")

const province = getAddressComponent("administrative_area_level_2")
const region = getAddressComponent("administrative_area_level_1")
const country = getAddressComponent("country")

const venueLocation = {
  placeId: place.id,
  venueName: place.displayName,
  formattedAddress: place.formattedAddress,
  city,
  province,
  region,
  country,
  latitude: place.location?.lat(),
  longitude: place.location?.lng(),
}

const coverageResult = getHardcodedCoverage({
  city: venueLocation.city,
  region: venueLocation.region,
})

const venueResult = {
  ...venueLocation,
  ...coverageResult,
}

// console.log("Venue location:", venueLocation)
// console.log("Coverage result:", coverageResult)
console.log("Complete result:", venueResult)


        const selectedVenue = [
          place.displayName,
          place.formattedAddress,
        ]
          .filter(Boolean)
          .join(", ")

        if (selectedVenue) {
          element.value = selectedVenue
          onVenueSelect(selectedVenue, coverageResult)
        }

      })

      containerRef.current.replaceChildren(element)
    }

    void initializeAutocomplete()

    return () => {
      cancelled = true
      autocompleteElement?.remove()
    }
  }, [])

  return <div ref={containerRef} className="w-full" />
}

/*
User selects suggestion
        ↓
gmp-select event runs
        ↓
placePrediction.toPlace() creates a Place
        ↓
fetchFields() requests its name and address
        ↓
onAddressSelect() updates your TanStack venue field

Docs
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new#add-an-autocomplete-widget
- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new#get-place-details

*/