import { integer, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

export const easyRideStateTable = pgTable("easyride_state", {
  id: integer("id").primaryKey(),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
