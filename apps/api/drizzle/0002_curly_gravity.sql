CREATE TYPE "public"."plan_type" AS ENUM('internet', 'cable', 'combo');--> statement-breakpoint
CREATE TYPE "public"."service_account_status" AS ENUM('active', 'suspended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('active', 'inactive', 'terminated', 'archived');--> statement-breakpoint
CREATE TABLE "collection_areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "collectors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"contact_number" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_account_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_id" integer NOT NULL,
	"status" "service_account_status" NOT NULL,
	"reason" text,
	"changed_by_user_id" integer,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_account_number" varchar(30) NOT NULL,
	"subscriber_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"installation_address" text NOT NULL,
	"activation_date" date,
	"billing_start_date" date,
	"billing_day" integer DEFAULT 1 NOT NULL,
	"current_rate" numeric(10, 2) NOT NULL,
	"status" "service_account_status" DEFAULT 'active' NOT NULL,
	"collection_area_id" integer,
	"collector_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_accounts_service_account_number_unique" UNIQUE("service_account_number")
);
--> statement-breakpoint
CREATE TABLE "service_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(30) NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" "plan_type" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"installation_fee" numeric(10, 2) DEFAULT '0',
	"speed_mbps" integer,
	"channel_count" integer,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_plans_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "subscriber_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" integer NOT NULL,
	"address_line" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_number" varchar(30) NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"contact_number" varchar(30),
	"email" varchar(150),
	"status" "subscriber_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"collection_area_id" integer,
	"assigned_collector_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_account_number_unique" UNIQUE("account_number")
);
--> statement-breakpoint
ALTER TABLE "service_account_status_history" ADD CONSTRAINT "service_account_status_history_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_account_status_history" ADD CONSTRAINT "service_account_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_plan_id_service_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."service_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_collection_area_id_collection_areas_id_fk" FOREIGN KEY ("collection_area_id") REFERENCES "public"."collection_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_accounts" ADD CONSTRAINT "service_accounts_collector_id_collectors_id_fk" FOREIGN KEY ("collector_id") REFERENCES "public"."collectors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriber_addresses" ADD CONSTRAINT "subscriber_addresses_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_collection_area_id_collection_areas_id_fk" FOREIGN KEY ("collection_area_id") REFERENCES "public"."collection_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_assigned_collector_id_collectors_id_fk" FOREIGN KEY ("assigned_collector_id") REFERENCES "public"."collectors"("id") ON DELETE no action ON UPDATE no action;