import { createLocation } from './data/locations.js'


const dummyLocations = [
  {
    name: "Joe's Pizza",
    type: "restaurant",
    address: "7 Carmine St, New York, NY",
    zipCode: "10014",
    latitude: 40.7305,
    longitude: -74.0021,
    phone: "212-366-1182",
    website: "https://www.joespizzanyc.com",
    priceCategory: 1
  },
  {
    name: "Central Park",
    type: "park",
    address: "Central Park, New York, NY",
    zipCode: "10024",
    latitude: 40.7851,
    longitude: -73.9683,
    phone: null,
    website: "https://www.centralparknyc.org",
    priceCategory: null
  },
  {
    name: "The Met",
    type: "museum",
    address: "1000 5th Ave, New York, NY",
    zipCode: "10028",
    latitude: 40.7794,
    longitude: -73.9632,
    phone: "212-535-7710",
    website: "https://www.metmuseum.org",
    priceCategory: 2
  },
  {
    name: "Katz's Delicatessen",
    type: "restaurant",
    address: "205 E Houston St, New York, NY",
    zipCode: "10002",
    latitude: 40.7223,
    longitude: -73.9873,
    phone: "212-254-2246",
    website: "https://www.katzsdelicatessen.com",
    priceCategory: 2
  }
]

const adminActor = { _id: "000000000000000000000001", role: "admin" }

for (const location of dummyLocations) {
  try {
    const result = await createLocation(location, { actor: adminActor })
    console.log(`Created: ${result.name}`)
  } catch (e) {
    console.error(`Failed to create ${location.name}:`, e)
  }
}

process.exit()
