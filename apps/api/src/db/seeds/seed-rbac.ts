import "dotenv/config";
import argon2 from "argon2";
import { db } from "../client.js";
import { users, roles, permissions, rolePermissions, userRoles } from "../schema.js";

const ROLE_NAMES = [
  { name: "owner", description: "Owner / Super Admin - full access" },
  { name: "admin", description: "Administrator" },
  { name: "cashier", description: "Cashier" },
  { name: "collection_supervisor", description: "Collection Supervisor" },
  { name: "auditor", description: "Accounting / Auditor" },
  { name: "technician", description: "Technician" },
  { name: "viewer", description: "Read-only Viewer" },
] as const;

const PERMISSION_KEYS = [
  "subscriber.view",
  "subscriber.manage",
  "billing.generate",
  "billing.view",
  "payment.create",
  "payment.reverse",
  "collection.manage",
  "collection.reconcile",
  "report.export",
  "user.manage",
  "backup.restore",
] as const;

// which roles get which permissions - refine this as you build later phases
const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  owner: [...PERMISSION_KEYS], // everything
  admin: [
    "subscriber.view",
    "subscriber.manage",
    "billing.generate",
    "billing.view",
    "payment.create",
    "collection.manage",
    "report.export",
  ],
  cashier: ["subscriber.view", "billing.view", "payment.create"],
  collection_supervisor: [
    "subscriber.view",
    "collection.manage",
    "collection.reconcile",
    "report.export",
  ],
  auditor: ["subscriber.view", "billing.view", "report.export"],
  technician: ["subscriber.view"],
  viewer: ["subscriber.view", "billing.view", "report.export"],
};

async function seed() {
  console.log("Seeding roles...");
  const insertedRoles = await db.insert(roles).values(ROLE_NAMES).returning();
  const roleIdByName = new Map(insertedRoles.map((r) => [r.name, r.id]));

  console.log("Seeding permissions...");
  const insertedPermissions = await db
    .insert(permissions)
    .values(PERMISSION_KEYS.map((key) => ({ key })))
    .returning();
  const permIdByKey = new Map(insertedPermissions.map((p) => [p.key, p.id]));

  console.log("Linking role_permissions...");
  const rolePermRows: { roleId: number; permissionId: number }[] = [];
  for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
    const roleId = roleIdByName.get(roleName)!;
    for (const key of permKeys) {
      const permissionId = permIdByKey.get(key)!;
      rolePermRows.push({ roleId, permissionId });
    }
  }
  await db.insert(rolePermissions).values(rolePermRows);

  console.log("Seeding admin user...");
  const passwordHash = await argon2.hash("ChangeMe123!");
  const [adminUser] = await db
    .insert(users)
    .values({
      username: "admin",
      passwordHash,
      fullName: "System Administrator",
      isActive: true,
    })
    .returning();

  await db.insert(userRoles).values({
    userId: adminUser.id,
    roleId: roleIdByName.get("owner")!,
  });

  console.log("Seed complete.");
  console.log("Login with username: admin / password: ChangeMe123!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});