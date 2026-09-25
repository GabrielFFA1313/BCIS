import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  primaryKey,
  text,
  numeric,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

// ── Users ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Roles ──────────────────────────────────────────────
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // e.g. "admin", "cashier"
  description: text("description"),
});

// ── Permissions ────────────────────────────────────────
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(), // e.g. "payment.create"
  description: text("description"),
});

// ── Role ↔ Permission (junction) ──────────────────────
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  })
);

// ── User ↔ Role (junction) ─────────────────────────────
export const userRoles = pgTable(
  "user_roles",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  })
);

// ── Enums ──────────────────────────────────────────────
export const planTypeEnum = pgEnum("plan_type", ["internet", "cable", "combo"]);
export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "active",
  "inactive",
  "terminated",
  "archived",
]);
export const serviceAccountStatusEnum = pgEnum("service_account_status", [
  "active",
  "suspended",
  "terminated",
]);

// ── Collection Areas (minimal, full version in Phase 6) ─
export const collectionAreas = pgTable("collection_areas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
});

// ── Collectors (minimal, full version in Phase 6) ───────
export const collectors = pgTable("collectors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  contactNumber: varchar("contact_number", { length: 30 }),
  isActive: boolean("is_active").notNull().default(true),
});

// ── Service Plans ────────────────────────────────────────
export const servicePlans = pgTable("service_plans", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  type: planTypeEnum("type").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  installationFee: numeric("installation_fee", { precision: 10, scale: 2 }).default("0"),
  speedMbps: integer("speed_mbps"), // internet plans only
  channelCount: integer("channel_count"), // cable plans only
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Subscribers ──────────────────────────────────────────
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  accountNumber: varchar("account_number", { length: 30 }).notNull().unique(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  contactNumber: varchar("contact_number", { length: 30 }),
  email: varchar("email", { length: 150 }),
  status: subscriberStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  collectionAreaId: integer("collection_area_id").references(() => collectionAreas.id),
  assignedCollectorId: integer("assigned_collector_id").references(() => collectors.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Subscriber Addresses ─────────────────────────────────
export const subscriberAddresses = pgTable("subscriber_addresses", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id")
    .notNull()
    .references(() => subscribers.id, { onDelete: "cascade" }),
  addressLine: text("address_line").notNull(),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Service Accounts ──────────────────────────────────────
export const serviceAccounts = pgTable("service_accounts", {
  id: serial("id").primaryKey(),
  serviceAccountNumber: varchar("service_account_number", { length: 30 })
    .notNull()
    .unique(),
  subscriberId: integer("subscriber_id")
    .notNull()
    .references(() => subscribers.id),
  planId: integer("plan_id")
    .notNull()
    .references(() => servicePlans.id),
  installationAddress: text("installation_address").notNull(),
  activationDate: date("activation_date"),
  billingStartDate: date("billing_start_date"),
  billingDay: integer("billing_day").notNull().default(1), // day of month, 1-28
  currentRate: numeric("current_rate", { precision: 10, scale: 2 }).notNull(),
  status: serviceAccountStatusEnum("status").notNull().default("active"),
  collectionAreaId: integer("collection_area_id").references(() => collectionAreas.id),
  collectorId: integer("collector_id").references(() => collectors.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Service Account Status History ────────────────────────
export const serviceAccountStatusHistory = pgTable("service_account_status_history", {
  id: serial("id").primaryKey(),
  serviceAccountId: integer("service_account_id")
    .notNull()
    .references(() => serviceAccounts.id, { onDelete: "cascade" }),
  status: serviceAccountStatusEnum("status").notNull(),
  reason: text("reason"),
  changedByUserId: integer("changed_by_user_id").references(() => users.id),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});