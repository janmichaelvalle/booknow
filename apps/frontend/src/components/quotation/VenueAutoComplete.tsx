import { GeoapifyGeocoderAutocomplete } from "@geoapify/react-geocoder-autocomplete"

type VenueAutocompleteProps = {
  venue: string
  onAddressSelect: (address: string) => void
}

export function VenueAutocomplete({
  venue,
  onAddressSelect,
}: VenueAutocompleteProps) {
  function handlePlaceSelect(place: any) {
    const formattedAddress = place?.properties?.formatted

    if (formattedAddress) {
      onAddressSelect(formattedAddress)
    }
  }

  return (
    <div className="venue-autocomplete">
    <GeoapifyGeocoderAutocomplete
      value={venue}
      placeholder="Search for a venue or address"
      lang="en"
      limit={5}
      filterByCountryCode={["ph"]}
      debounceDelay={200}
      placeSelect={handlePlaceSelect}
    />
    </div>
  )
}