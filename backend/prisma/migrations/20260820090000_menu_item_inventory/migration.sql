ALTER TABLE "menu_items"
ADD COLUMN IF NOT EXISTS "availableQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "soldQuantity" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "menu_items_availableQuantity_idx" ON "menu_items"("availableQuantity");
