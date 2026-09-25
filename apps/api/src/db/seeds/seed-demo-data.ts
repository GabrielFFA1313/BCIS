import "dotenv/config";
import { db } from "../client.js";
import { servicePlans } from "../schema.js";

async function seed() {
  console.log("Seeding service plans...");
  await db.insert(servicePlans).values([
    // 3 Internet plans
    { code: "INET-10", name: "Internet 10 Mbps", type: "internet", price: "699.00", speedMbps: 10 },
    { code: "INET-25", name: "Internet 25 Mbps", type: "internet", price: "999.00", speedMbps: 25 },
    { code: "INET-50", name: "Internet 50 Mbps", type: "internet", price: "1499.00", speedMbps: 50 },
    // 2 Cable plans
    { code: "CABLE-BASIC", name: "Cable Basic", type: "cable", price: "399.00", channelCount: 40 },
    { code: "CABLE-PREM", name: "Cable Premium", type: "cable", price: "699.00", channelCount: 80 },
    // 2 Combo plans
    {
      code: "COMBO-25",
      name: "Internet 25 + Cable Basic",
      type: "combo",
      price: "1299.00",
      speedMbps: 25,
      channelCount: 40,
    },
    {
      code: "COMBO-50",
      name: "Internet 50 + Cable Premium",
      type: "combo",
      price: "1999.00",
      speedMbps: 50,
      channelCount: 80,
    },
  ]);

  console.log("Demo data seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});