-- Drop slug columns from Menu and MenuItem
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "slug";
ALTER TABLE "MenuItem" DROP COLUMN IF EXISTS "url";
ALTER TABLE "Menu" DROP COLUMN IF EXISTS "slug";

-- Drop unique index that referenced Menu.slug if it exists
DROP INDEX IF EXISTS "Menu_slug_key";
