-- CreateEnum
CREATE TYPE "DiscountSource" AS ENUM ('NONE', 'OFFER', 'GAME');

-- CreateEnum
CREATE TYPE "OfferApplicableTo" AS ENUM ('TABLE', 'ROOM', 'BOTH');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "appliedOfferId" UUID,
ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercentage" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountSource" "DiscountSource" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "discountSource" "DiscountSource" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "applicableTo" "OfferApplicableTo" NOT NULL DEFAULT 'BOTH';

-- CreateTable
CREATE TABLE "booking_guests" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "aadhaarNumber" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "booking_guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_guests_bookingId_idx" ON "booking_guests"("bookingId");

-- CreateIndex
CREATE INDEX "booking_guests_deletedAt_idx" ON "booking_guests"("deletedAt");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_appliedOfferId_fkey" FOREIGN KEY ("appliedOfferId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_guests" ADD CONSTRAINT "booking_guests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
