-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'ONLINE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_table_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_table_session_id_fkey";

-- DropIndex
DROP INDEX "orders_table_session_id_order_code_key";

-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "delivery_base_fee" INTEGER DEFAULT 15000,
ADD COLUMN     "delivery_base_km" DOUBLE PRECISION DEFAULT 2,
ADD COLUMN     "delivery_fee_per_km" INTEGER DEFAULT 5000,
ADD COLUMN     "delivery_max_km" DOUBLE PRECISION DEFAULT 10,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_type" "OrderType" NOT NULL DEFAULT 'DINE_IN',
ALTER COLUMN "table_id" DROP NOT NULL,
ALTER COLUMN "table_session_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "delivery_infos" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ward" TEXT,
    "district" TEXT,
    "customer_lat" DOUBLE PRECISION,
    "customer_lng" DOUBLE PRECISION,
    "distance_km" DOUBLE PRECISION,
    "shipping_fee" INTEGER NOT NULL DEFAULT 0,
    "delivery_status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_infos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_infos_order_id_key" ON "delivery_infos"("order_id");

-- CreateIndex
CREATE INDEX "orders_order_type_created_at_idx" ON "orders"("order_type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_session_id_fkey" FOREIGN KEY ("table_session_id") REFERENCES "table_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_infos" ADD CONSTRAINT "delivery_infos_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
