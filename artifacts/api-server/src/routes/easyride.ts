import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, easyRideStateTable } from "@workspace/db";
import {
  GetEasyRideStateResponse,
  SaveEasyRideStateBody,
  SaveEasyRideStateResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function createInitialState() {
  const now = new Date();
  const stamp = (minutesAgo: number) =>
    new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  return {
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
      {
        id: "bike-001",
        code: "ER-024",
        type: "City bike",
        stationId: "station-main",
        status: "available",
        condition: "excellent",
        lastChecked: stamp(14),
      },
      {
        id: "bike-002",
        code: "ER-018",
        type: "City bike",
        stationId: "station-main",
        status: "available",
        condition: "good",
        lastChecked: stamp(37),
      },
      {
        id: "bike-003",
        code: "ER-031",
        type: "City bike",
        stationId: "station-pharmacy",
        status: "available",
        condition: "good",
        lastChecked: stamp(22),
      },
      {
        id: "bike-004",
        code: "ER-011",
        type: "City bike",
        stationId: "station-pharmacy",
        status: "available",
        condition: "fair",
        lastChecked: stamp(62),
      },
      {
        id: "bike-005",
        code: "ER-042",
        type: "City bike",
        stationId: "station-kikoni",
        status: "available",
        condition: "excellent",
        lastChecked: stamp(9),
      },
      {
        id: "bike-006",
        code: "ER-035",
        type: "City bike",
        stationId: "station-kikoni",
        status: "available",
        condition: "good",
        lastChecked: stamp(48),
      },
      {
        id: "bike-007",
        code: "ER-009",
        type: "City bike",
        stationId: "station-wandegeya",
        status: "available",
        condition: "good",
        lastChecked: stamp(31),
      },
      {
        id: "bike-008",
        code: "ER-027",
        type: "City bike",
        stationId: "station-main",
        status: "rented",
        condition: "good",
        lastChecked: stamp(120),
      },
      {
        id: "bike-009",
        code: "ER-014",
        type: "City bike",
        stationId: "station-pharmacy",
        status: "rented",
        condition: "good",
        lastChecked: stamp(94),
      },
      {
        id: "bike-010",
        code: "ER-006",
        type: "City bike",
        stationId: "station-main",
        status: "maintenance",
        condition: "faulty",
        lastChecked: stamp(180),
      },
      {
        id: "bike-011",
        code: "ER-019",
        type: "City bike",
        stationId: "station-wandegeya",
        status: "maintenance",
        condition: "faulty",
        lastChecked: stamp(210),
      },
    ],
    rentals: [
      {
        id: "rental-1024",
        customerName: "Rider 08",
        bicycleId: "bike-008",
        bicycleCode: "ER-027",
        pickupStationId: "station-main",
        startedAt: stamp(48),
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
        customerName: "Rider 12",
        bicycleId: "bike-009",
        bicycleCode: "ER-014",
        pickupStationId: "station-pharmacy",
        startedAt: stamp(72),
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
        customerName: "Rider 04",
        bicycleId: "bike-003",
        bicycleCode: "ER-031",
        pickupStationId: "station-pharmacy",
        startedAt: stamp(198),
        returnedAt: stamp(121),
        durationMinutes: 77,
        amount: 500,
        paymentStatus: "paid",
        status: "completed",
        returnCondition: "good",
        returnNotes: null,
      },
      {
        id: "rental-1021",
        customerName: "Rider 03",
        bicycleId: "bike-005",
        bicycleCode: "ER-042",
        pickupStationId: "station-kikoni",
        startedAt: stamp(264),
        returnedAt: stamp(210),
        durationMinutes: 54,
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
        bicycleId: "bike-010",
        bicycleCode: "ER-006",
        stationName: "Main Campus",
        issue: "Brake adjustment required",
        reportedAt: stamp(188),
        status: "in_progress",
        repairCost: 0,
      },
      {
        id: "issue-207",
        bicycleId: "bike-011",
        bicycleCode: "ER-019",
        stationName: "Wandegeya",
        issue: "Rear tyre needs replacement",
        reportedAt: stamp(77),
        status: "open",
        repairCost: 0,
      },
    ],
    activity: [
      {
        id: "activity-1",
        message: "ER-031 returned to Pharmacy Gate",
        createdAt: stamp(24),
        kind: "return",
      },
      {
        id: "activity-2",
        message: "ER-027 rented from Main Campus",
        createdAt: stamp(48),
        kind: "rental",
      },
      {
        id: "activity-3",
        message: "Brake adjustment opened for ER-006",
        createdAt: stamp(188),
        kind: "maintenance",
      },
      {
        id: "activity-4",
        message: "Payment recorded for rental 1022",
        createdAt: stamp(121),
        kind: "payment",
      },
    ],
  };
}

async function loadOrCreateState() {
  const [row] = await db
    .select()
    .from(easyRideStateTable)
    .where(eq(easyRideStateTable.id, 1));
  if (row) return row.state;

  const state = createInitialState();
  await db
    .insert(easyRideStateTable)
    .values({ id: 1, state })
    .onConflictDoNothing();

  const [created] = await db
    .select()
    .from(easyRideStateTable)
    .where(eq(easyRideStateTable.id, 1));
  return created?.state ?? state;
}

router.get("/easyride/state", async (_req, res): Promise<void> => {
  const state = await loadOrCreateState();
  res.json(GetEasyRideStateResponse.parse(state));
});

router.put("/easyride/state", async (req, res): Promise<void> => {
  const parsed = SaveEasyRideStateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db
    .insert(easyRideStateTable)
    .values({ id: 1, state: parsed.data })
    .onConflictDoUpdate({
      target: easyRideStateTable.id,
      set: { state: parsed.data, updatedAt: new Date() },
    })
    .returning();

  res.json(SaveEasyRideStateResponse.parse(saved.state));
});

export default router;
