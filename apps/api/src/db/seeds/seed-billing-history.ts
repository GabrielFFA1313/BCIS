import "dotenv/config";
import { db } from "../client.js";
import {
  subscribers,
  subscriberAddresses,
  serviceAccounts,
  servicePlans,
  collectionAreas,
  collectors,
} from "../schema.js";

async function seed() {
  console.log("Fetching reference data...");
  const plans = await db.select().from(servicePlans);
  const areas = await db.select().from(collectionAreas);
  const collectorList = await db.select().from(collectors);

  if (plans.length === 0) {
    throw new Error("No service plans found. Run 'npm run seed:demo' first.");
  }

  console.log("Creating demo subscribers with service accounts...");
  const names = [
    "Maria Santos", "Jose Rizal Jr.", "Ana Reyes", "Pedro Cruz", "Carmen Dela Peña",
    "Ramon Bautista", "Luz Villanueva", "Antonio Garcia", "Rosa Mendoza", "Manuel Torres",
  ];

  const createdAccounts: { subscriberId: number; serviceAccountId: number; rate: string }[] = [];

  for (let i = 0; i < names.length; i++) {
    const plan = plans[i % plans.length];
    const area = areas[i % areas.length];
    const collector = collectorList[i % collectorList.length];

    const [subscriber] = await db
      .insert(subscribers)
      .values({
        accountNumber: `DEMO-${String(1000 + i)}`,
        fullName: names[i],
        contactNumber: `09${String(170000000 + i * 111111).slice(0, 9)}`,
        collectionAreaId: area?.id,
        assignedCollectorId: collector?.id,
      })
      .returning();

    await db.insert(subscriberAddresses).values({
      subscriberId: subscriber.id,
      addressLine: `${100 + i} Demo Street, ${area?.name || "Cagayan de Oro"}`,
      isPrimary: true,
    });

    const [serviceAccount] = await db
      .insert(serviceAccounts)
      .values({
        serviceAccountNumber: `DEMO-SA-${String(1000 + i)}`,
        subscriberId: subscriber.id,
        planId: plan.id,
        installationAddress: `${100 + i} Demo Street, ${area?.name || "Cagayan de Oro"}`,
        billingDay: 1,
        currentRate: plan.price,
        collectionAreaId: area?.id,
        collectorId: collector?.id,
      })
      .returning();

    createdAccounts.push({
      subscriberId: subscriber.id,
      serviceAccountId: serviceAccount.id,
      rate: plan.price,
    });
  }

  console.log(`Created ${createdAccounts.length} demo subscribers with service accounts.`);
  console.log("Demo billing data seed complete. Now run billing generation via the API or UI for 3 months to build ledger history.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});