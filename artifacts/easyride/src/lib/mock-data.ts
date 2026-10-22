import type {
  EasyRideState,
  EasyRideBicycle,
  EasyRideStation,
  EasyRideRental,
  EasyRideMaintenance,
  EasyRideActivity,
} from "@workspace/api-client-react";
import { readCustomBikeMeta } from "@/lib/custom-bike-meta";

export type BikeType = "Electric" | "Mountain" | "City" | "Racing" | "Hybrid";

export interface BikeMeta {
  modelName: string;
  type: BikeType;
  image: string;
  specs: {
    range?: string;
    speed?: string;
    gears?: string;
    weight?: string;
    power?: string;
    highlight: string;
  };
}

export const bikeMetadata: Record<string, BikeMeta> = {
  // Electric bikes
  "bike-elec-1": {
    modelName: "Trek FX+ 3 E-Bike",
    type: "Electric",
    image: "/bikes/bike-1.jpg",
    specs: { range: "65 km", speed: "32 km/h", power: "250W", highlight: "Long-range pedal assist" },
  },
  "bike-elec-2": {
    modelName: "Cannondale Tesoro Neo X",
    type: "Electric",
    image: "/bikes/bike-2.jpg",
    specs: { range: "75 km", speed: "35 km/h", power: "500Wh", highlight: "Bosch Smart System" },
  },
  "bike-elec-3": {
    modelName: "Specialized Turbo Vado 4.0",
    type: "Electric",
    image: "/bikes/bike-3.jpg",
    specs: { range: "60 km", speed: "32 km/h", power: "250W", highlight: "Ultra-smooth commuter motor" },
  },
  "bike-elec-4": {
    modelName: "Rad Power RadCity 5 Plus",
    type: "Electric",
    image: "/bikes/bike-4.jpg",
    specs: { range: "55 km", speed: "30 km/h", power: "750W", highlight: "Comfort cruiser with throttle" },
  },
  "bike-elec-5": {
    modelName: "Giant Explore E+ Pro",
    type: "Electric",
    image: "/bikes/bike-5.jpg",
    specs: { range: "80 km", speed: "35 km/h", power: "625Wh", highlight: "SyncDrive high-torque power" },
  },

  // Mountain bikes
  "bike-mtn-1": {
    modelName: "Trek Marlin 7 Gen 3",
    type: "Mountain",
    image: "/bikes/bike-2.jpg",
    specs: { gears: "10-speed Deore", weight: "13.8 kg", highlight: "RockShox Judy fork lockout" },
  },
  "bike-mtn-2": {
    modelName: "Giant Talon 29 1",
    type: "Mountain",
    image: "/bikes/bike-3.jpg",
    specs: { gears: "12-speed Shimano", weight: "13.2 kg", highlight: "29-inch tubeless-ready rims" },
  },
  "bike-mtn-3": {
    modelName: "Specialized Rockhopper Comp",
    type: "Mountain",
    image: "/bikes/bike-4.jpg",
    specs: { gears: "9-speed MicroSHIFT", weight: "12.9 kg", highlight: "Hydraulic disc trail brakes" },
  },
  "bike-mtn-4": {
    modelName: "Cannondale Trail 8",
    type: "Mountain",
    image: "/bikes/bike-5.jpg",
    specs: { gears: "16-speed Tourney", weight: "14.1 kg", highlight: "All-terrain gravel & hill tires" },
  },
  "bike-mtn-5": {
    modelName: "Santa Cruz Chameleon D",
    type: "Mountain",
    image: "/bikes/bike-1.jpg",
    specs: { gears: "12-speed SX Eagle", weight: "13.5 kg", highlight: "Rugged hardtail downhill build" },
  },

  // City bikes
  "bike-city-1": {
    modelName: "Trek FX 3 Disc Commuter",
    type: "City",
    image: "/bikes/bike-3.jpg",
    specs: { gears: "10-speed Shimano", weight: "11.4 kg", highlight: "Lightweight alloy frame & rack" },
  },
  "bike-city-2": {
    modelName: "Giant Escape 3 City",
    type: "City",
    image: "/bikes/bike-4.jpg",
    specs: { gears: "21-speed Shimano", weight: "12.1 kg", highlight: "Upright geometry & mudguards" },
  },
  "bike-city-3": {
    modelName: "Specialized Sirrus X 2.0",
    type: "City",
    image: "/bikes/bike-5.jpg",
    specs: { gears: "8-speed MicroSHIFT", weight: "11.8 kg", highlight: "Wide puncture-resistant tires" },
  },
  "bike-city-4": {
    modelName: "Cannondale Quick 4",
    type: "City",
    image: "/bikes/bike-1.jpg",
    specs: { gears: "9-speed Advent", weight: "10.9 kg", highlight: "Agile urban navigation build" },
  },
  "bike-city-5": {
    modelName: "Marin Fairfax 1 Campus",
    type: "City",
    image: "/bikes/bike-2.jpg",
    specs: { gears: "21-speed Tourney", weight: "12.3 kg", highlight: "Comfort saddle with kickstand" },
  },

  // Racing bikes
  "bike-race-1": {
    modelName: "Specialized Tarmac SL7",
    type: "Racing",
    image: "/bikes/bike-4.jpg",
    specs: { gears: "22-speed 105 Di2", weight: "7.9 kg", highlight: "Full carbon aerodynamic frame" },
  },
  "bike-race-2": {
    modelName: "Trek Émonda SL 6 Disc",
    type: "Racing",
    image: "/bikes/bike-5.jpg",
    specs: { gears: "22-speed Ultegra", weight: "8.2 kg", highlight: "Ultra-lightweight climbing road bike" },
  },
  "bike-race-3": {
    modelName: "Cannondale SuperSix EVO",
    type: "Racing",
    image: "/bikes/bike-1.jpg",
    specs: { gears: "24-speed Rival AXS", weight: "8.1 kg", highlight: "Wind-tunnel tested carbon aero" },
  },
  "bike-race-4": {
    modelName: "Giant Propel Advanced 2",
    type: "Racing",
    image: "/bikes/bike-2.jpg",
    specs: { gears: "22-speed Shimano 105", weight: "8.4 kg", highlight: "AeroSystem shaping for max velocity" },
  },
  "bike-race-5": {
    modelName: "Cervélo R5 Disc",
    type: "Racing",
    image: "/bikes/bike-3.jpg",
    specs: { gears: "24-speed Force eTap", weight: "7.7 kg", highlight: "WorldTour championship geometry" },
  },

  // Hybrid bikes
  "bike-hyb-1": {
    modelName: "Trek Dual Sport 3 Gen 5",
    type: "Hybrid",
    image: "/bikes/bike-5.jpg",
    specs: { gears: "10-speed Deore", weight: "11.8 kg", highlight: "Pavement & rough trail versatility" },
  },
  "bike-hyb-2": {
    modelName: "Giant Roam 3 Disc",
    type: "Hybrid",
    image: "/bikes/bike-1.jpg",
    specs: { gears: "16-speed Tourney", weight: "12.5 kg", highlight: "Lockout front suspension & gravel tires" },
  },
  "bike-hyb-3": {
    modelName: "Specialized Crosstrail Sport",
    type: "Hybrid",
    image: "/bikes/bike-2.jpg",
    specs: { gears: "18-speed Altus", weight: "12.2 kg", highlight: "Ergonomic Body Geometry grips" },
  },
  "bike-hyb-4": {
    modelName: "Cannondale Bad Boy 3",
    type: "Hybrid",
    image: "/bikes/bike-3.jpg",
    specs: { gears: "16-speed microSHIFT", weight: "11.9 kg", highlight: "Stealth Lefty rigid fork styling" },
  },

  // Bikes that are currently out on hire or in the workshop
  "bike-elec-rented": {
    modelName: "Trek FX+ 3 E-Bike",
    type: "Electric",
    image: "/bikes/bike-1.jpg",
    specs: { range: "65 km", speed: "32 km/h", power: "250W", highlight: "Long-range pedal assist" },
  },
  "bike-mtn-rented": {
    modelName: "Trek Marlin 7 Gen 3",
    type: "Mountain",
    image: "/bikes/bike-2.jpg",
    specs: { gears: "10-speed Deore", weight: "13.8 kg", highlight: "RockShox Judy fork lockout" },
  },
  "bike-city-maint": {
    modelName: "Giant Escape 3 City",
    type: "City",
    image: "/bikes/bike-4.jpg",
    specs: { gears: "21-speed Shimano", weight: "12.1 kg", highlight: "Upright geometry & mudguards" },
  },
  "bike-race-maint": {
    modelName: "Specialized Tarmac SL7",
    type: "Racing",
    image: "/bikes/bike-4.jpg",
    specs: { gears: "22-speed 105 Di2", weight: "7.9 kg", highlight: "Full carbon aerodynamic frame" },
  },
};

export function getBikeMeta(bike: EasyRideBicycle, index = 0): BikeMeta {
  if (bikeMetadata[bike.id]) {
    return bikeMetadata[bike.id];
  }
  // Bicycles registered by staff at runtime keep their details in a local
  // store (there is no backend).
  const custom = readCustomBikeMeta()[bike.id];
  if (custom) {
    return {
      modelName: custom.modelName,
      type: (custom.type as BikeType) || "City",
      image: custom.image,
      specs: custom.specs,
    };
  }
  // Fallback metadata based on type
  const type = (bike.type as BikeType) || "City";
  const defaultImages: Record<BikeType, string> = {
    Electric: "/bikes/bike-1.jpg",
    Mountain: "/bikes/bike-2.jpg",
    City: "/bikes/bike-3.jpg",
    Racing: "/bikes/bike-4.jpg",
    Hybrid: "/bikes/bike-5.jpg",
  };
  return {
    modelName: `${type} Ride ${bike.code}`,
    type,
    image: defaultImages[type] || "/bikes/bike-1.jpg",
    specs: {
      highlight: `${type} bicycle tuned for student & campus routes`,
    },
  };
}

const now = new Date();
const stamp = (minutesAgo: number) =>
  new Date(now.getTime() - minutesAgo * 60_000).toISOString();

export const initialEasyRideState: EasyRideState = {
  config: {
    serviceName: "EasyRide",
    serviceArea: "Makerere · Kikoni · Wandegeya",
    hourlyRate: 500,
    operatingCostPerDay: 0,
    currency: "UGX",
  },
  stations: [
    {
      id: "station-main",
      name: "Main Campus",
      area: "Makerere",
      landmark: "Main Library entrance",
      active: true,
    },
    {
      id: "station-pharmacy",
      name: "Pharmacy Gate",
      area: "Makerere",
      landmark: "School of Pharmacy, Wandegeya Gate",
      active: true,
    },
    {
      id: "station-kikoni",
      name: "Kikoni",
      area: "Kikoni",
      landmark: "Kikoni road junction",
      active: true,
    },
    {
      id: "station-wandegeya",
      name: "Wandegeya",
      area: "Wandegeya",
      landmark: "Market entrance",
      active: true,
    },
  ],
  bicycles: [
    // --- Electric ---
    {
      id: "bike-elec-1",
      code: "ER-E101",
      type: "Electric",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(12),
    },
    {
      id: "bike-elec-2",
      code: "ER-E102",
      type: "Electric",
      stationId: "station-pharmacy",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(25),
    },
    {
      id: "bike-elec-3",
      code: "ER-E103",
      type: "Electric",
      stationId: "station-kikoni",
      status: "available",
      condition: "good",
      lastChecked: stamp(35),
    },
    {
      id: "bike-elec-4",
      code: "ER-E104",
      type: "Electric",
      stationId: "station-wandegeya",
      status: "available",
      condition: "good",
      lastChecked: stamp(15),
    },
    {
      id: "bike-elec-5",
      code: "ER-E105",
      type: "Electric",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(42),
    },

    // --- Mountain ---
    {
      id: "bike-mtn-1",
      code: "ER-M201",
      type: "Mountain",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(18),
    },
    {
      id: "bike-mtn-2",
      code: "ER-M202",
      type: "Mountain",
      stationId: "station-pharmacy",
      status: "available",
      condition: "good",
      lastChecked: stamp(28),
    },
    {
      id: "bike-mtn-3",
      code: "ER-M203",
      type: "Mountain",
      stationId: "station-kikoni",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(45),
    },
    {
      id: "bike-mtn-4",
      code: "ER-M204",
      type: "Mountain",
      stationId: "station-wandegeya",
      status: "available",
      condition: "good",
      lastChecked: stamp(30),
    },
    {
      id: "bike-mtn-5",
      code: "ER-M205",
      type: "Mountain",
      stationId: "station-main",
      status: "available",
      condition: "fair",
      lastChecked: stamp(55),
    },

    // --- City ---
    {
      id: "bike-city-1",
      code: "ER-C301",
      type: "City",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(10),
    },
    {
      id: "bike-city-2",
      code: "ER-C302",
      type: "City",
      stationId: "station-pharmacy",
      status: "available",
      condition: "good",
      lastChecked: stamp(22),
    },
    {
      id: "bike-city-3",
      code: "ER-C303",
      type: "City",
      stationId: "station-kikoni",
      status: "available",
      condition: "good",
      lastChecked: stamp(38),
    },
    {
      id: "bike-city-4",
      code: "ER-C304",
      type: "City",
      stationId: "station-wandegeya",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(14),
    },
    {
      id: "bike-city-5",
      code: "ER-C305",
      type: "City",
      stationId: "station-main",
      status: "available",
      condition: "good",
      lastChecked: stamp(50),
    },

    // --- Racing ---
    {
      id: "bike-race-1",
      code: "ER-R401",
      type: "Racing",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(16),
    },
    {
      id: "bike-race-2",
      code: "ER-R402",
      type: "Racing",
      stationId: "station-pharmacy",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(29),
    },
    {
      id: "bike-race-3",
      code: "ER-R403",
      type: "Racing",
      stationId: "station-kikoni",
      status: "available",
      condition: "good",
      lastChecked: stamp(40),
    },
    {
      id: "bike-race-4",
      code: "ER-R404",
      type: "Racing",
      stationId: "station-wandegeya",
      status: "available",
      condition: "good",
      lastChecked: stamp(20),
    },
    {
      id: "bike-race-5",
      code: "ER-R405",
      type: "Racing",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(60),
    },

    // --- Hybrid ---
    {
      id: "bike-hyb-1",
      code: "ER-H501",
      type: "Hybrid",
      stationId: "station-main",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(15),
    },
    {
      id: "bike-hyb-2",
      code: "ER-H502",
      type: "Hybrid",
      stationId: "station-pharmacy",
      status: "available",
      condition: "good",
      lastChecked: stamp(32),
    },
    {
      id: "bike-hyb-3",
      code: "ER-H503",
      type: "Hybrid",
      stationId: "station-kikoni",
      status: "available",
      condition: "good",
      lastChecked: stamp(44),
    },
    {
      id: "bike-hyb-4",
      code: "ER-H504",
      type: "Hybrid",
      stationId: "station-wandegeya",
      status: "available",
      condition: "excellent",
      lastChecked: stamp(26),
    },

    // Currently Rented Bikes
    {
      id: "bike-elec-rented",
      code: "ER-E106",
      type: "Electric",
      stationId: "station-main",
      status: "rented",
      condition: "good",
      lastChecked: stamp(120),
    },
    {
      id: "bike-mtn-rented",
      code: "ER-M206",
      type: "Mountain",
      stationId: "station-pharmacy",
      status: "rented",
      condition: "good",
      lastChecked: stamp(95),
    },

    // Maintenance Bikes
    {
      id: "bike-city-maint",
      code: "ER-C306",
      type: "City",
      stationId: "station-main",
      status: "maintenance",
      condition: "faulty",
      lastChecked: stamp(180),
    },
    {
      id: "bike-race-maint",
      code: "ER-R406",
      type: "Racing",
      stationId: "station-wandegeya",
      status: "maintenance",
      condition: "faulty",
      lastChecked: stamp(210),
    },
  ],
  rentals: [
    {
      id: "rental-1024",
      customerName: "Grace Nakato",
      bicycleId: "bike-elec-rented",
      bicycleCode: "ER-E106",
      pickupStationId: "station-main",
      startedAt: stamp(45),
      returnedAt: null,
      durationMinutes: null,
      amount: 500,
      paymentStatus: "pending",
      status: "active",
      returnCondition: null,
      returnNotes: null,
    },
    {
      id: "rental-1023",
      customerName: "David Otim",
      bicycleId: "bike-mtn-rented",
      bicycleCode: "ER-M206",
      pickupStationId: "station-pharmacy",
      startedAt: stamp(75),
      returnedAt: null,
      durationMinutes: null,
      amount: 500,
      paymentStatus: "paid",
      status: "active",
      returnCondition: null,
      returnNotes: null,
    },
    {
      id: "rental-1022",
      customerName: "Sarah Kembabazi",
      bicycleId: "bike-city-1",
      bicycleCode: "ER-C301",
      pickupStationId: "station-pharmacy",
      startedAt: stamp(190),
      returnedAt: stamp(120),
      durationMinutes: 70,
      amount: 1000,
      paymentStatus: "paid",
      status: "completed",
      returnCondition: "good",
      returnNotes: null,
    },
    {
      id: "rental-1021",
      customerName: "Brian Mugisha",
      bicycleId: "bike-hyb-1",
      bicycleCode: "ER-H501",
      pickupStationId: "station-kikoni",
      startedAt: stamp(250),
      returnedAt: stamp(205),
      durationMinutes: 45,
      amount: 500,
      paymentStatus: "paid",
      status: "completed",
      returnCondition: "excellent",
      returnNotes: null,
    },
  ],
  maintenance: [
    {
      id: "issue-206",
      bicycleId: "bike-city-maint",
      bicycleCode: "ER-C306",
      stationName: "Main Campus",
      issue: "Front brake cable tension adjustment",
      reportedAt: stamp(180),
      status: "in_progress",
      repairCost: 0,
    },
    {
      id: "issue-207",
      bicycleId: "bike-race-maint",
      bicycleCode: "ER-R406",
      stationName: "Wandegeya",
      issue: "Rear road tire puncture replacement",
      reportedAt: stamp(80),
      status: "open",
      repairCost: 0,
    },
  ],
  activity: [
    {
      id: "act-1",
      message: "ER-E106 rented by Grace Nakato at Main Campus",
      createdAt: stamp(45),
      kind: "rental",
    },
    {
      id: "act-2",
      message: "ER-M206 rented by David Otim at Pharmacy Gate",
      createdAt: stamp(75),
      kind: "rental",
    },
    {
      id: "act-3",
      message: "ER-C301 returned to Pharmacy Gate · UGX 1,000 paid",
      createdAt: stamp(120),
      kind: "return",
    },
    {
      id: "act-4",
      message: "ER-R406 reported for rear tire inspection at Wandegeya",
      createdAt: stamp(150),
      kind: "maintenance",
    },
  ],
};
