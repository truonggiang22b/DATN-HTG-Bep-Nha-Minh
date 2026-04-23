-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MenuItemStatus" AS ENUM ('ACTIVE', 'SOLD_OUT', 'HIDDEN');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'KITCHEN');

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabase_auth_user_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "default_branch_id" TEXT,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "store_id" TEXT NOT NULL,
    "branch_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "table_code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "qr_token" TEXT NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_sessions" (
    "id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "order_counter" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,0) NOT NULL,
    "image_url" TEXT,
    "short_description" TEXT,
    "ingredients" TEXT,
    "tags_json" JSONB NOT NULL DEFAULT '[]',
    "status" "MenuItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_option_groups" (
    "id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_select" INTEGER NOT NULL DEFAULT 0,
    "max_select" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_option_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_options" (
    "id" TEXT NOT NULL,
    "option_group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price_delta" DECIMAL(10,0) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "table_session_id" TEXT NOT NULL,
    "client_session_id" TEXT NOT NULL,
    "order_code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "subtotal" DECIMAL(10,0) NOT NULL,
    "customer_note" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "name_snapshot" TEXT NOT NULL,
    "price_snapshot" DECIMAL(10,0) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selected_options_snapshot_json" JSONB NOT NULL DEFAULT '[]',
    "note" TEXT DEFAULT '',
    "line_total" DECIMAL(10,0) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "reason" TEXT,
    "changed_by_user_id" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_auth_user_id_key" ON "users"("supabase_auth_user_id");

-- CreateIndex
CREATE INDEX "users_store_id_email_idx" ON "users"("store_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_qr_token_key" ON "dining_tables"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_branch_id_table_code_key" ON "dining_tables"("branch_id", "table_code");

-- CreateIndex
CREATE INDEX "table_sessions_table_id_status_opened_at_idx" ON "table_sessions"("table_id", "status", "opened_at" DESC);

-- CreateIndex
CREATE INDEX "menu_items_category_id_status_sort_order_idx" ON "menu_items"("category_id", "status", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "orders_table_session_id_created_at_idx" ON "orders"("table_session_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_store_id_branch_id_created_at_idx" ON "orders"("store_id", "branch_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "orders_table_session_id_order_code_key" ON "orders"("table_session_id", "order_code");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_changed_at_idx" ON "order_status_history"("order_id", "changed_at" DESC);

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_sessions" ADD CONSTRAINT "table_sessions_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_option_groups" ADD CONSTRAINT "menu_option_groups_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_options" ADD CONSTRAINT "menu_options_option_group_id_fkey" FOREIGN KEY ("option_group_id") REFERENCES "menu_option_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_session_id_fkey" FOREIGN KEY ("table_session_id") REFERENCES "table_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
