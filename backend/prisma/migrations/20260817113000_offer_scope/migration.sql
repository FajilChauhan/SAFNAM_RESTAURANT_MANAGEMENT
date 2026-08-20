ALTER TABLE "offers"
ADD COLUMN "allFloors" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "allRoomTypes" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "offer_floors" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "floorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offer_floors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "offer_room_types" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "roomType" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offer_room_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offer_floors_offerId_floorId_key" ON "offer_floors"("offerId", "floorId");
CREATE INDEX "offer_floors_floorId_idx" ON "offer_floors"("floorId");

CREATE UNIQUE INDEX "offer_room_types_offerId_roomType_key" ON "offer_room_types"("offerId", "roomType");
CREATE INDEX "offer_room_types_roomType_idx" ON "offer_room_types"("roomType");

ALTER TABLE "offer_floors"
ADD CONSTRAINT "offer_floors_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offer_floors"
ADD CONSTRAINT "offer_floors_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offer_room_types"
ADD CONSTRAINT "offer_room_types_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
