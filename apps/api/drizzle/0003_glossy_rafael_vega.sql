CREATE TYPE "public"."adjustment_type" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'unpaid', 'partially_paid', 'paid', 'overdue', 'void', 'credited');--> statement-breakpoint
CREATE TABLE "adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"type" "adjustment_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"reason" text NOT NULL,
	"created_by_user_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_year" integer NOT NULL,
	"period_month" integer NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"generated_by_user_id" integer,
	CONSTRAINT "billing_cycles_period_year_period_month_unique" UNIQUE("period_year","period_month")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" varchar(200) NOT NULL,
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(30) NOT NULL,
	"service_account_id" integer NOT NULL,
	"billing_cycle_id" integer NOT NULL,
	"subscription_charge" numeric(10, 2) NOT NULL,
	"fees" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"status" "invoice_status" DEFAULT 'unpaid' NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "invoices_service_account_id_billing_cycle_id_unique" UNIQUE("service_account_id","billing_cycle_id")
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" integer NOT NULL,
	"service_account_id" integer,
	"entry_date" timestamp DEFAULT now() NOT NULL,
	"reference" varchar(50) NOT NULL,
	"description" varchar(200) NOT NULL,
	"debit" numeric(10, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adjustments" ADD CONSTRAINT "adjustments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_billing_cycle_id_billing_cycles_id_fk" FOREIGN KEY ("billing_cycle_id") REFERENCES "public"."billing_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_service_account_id_service_accounts_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "public"."service_accounts"("id") ON DELETE no action ON UPDATE no action;