/*
  # Update davanu_kartes_pasutijumi table structure

  1. Schema Changes
    - Add `specific_ritual_type` column for ritual-specific gift cards
    - Add `custom_price_value` column for custom value gift cards
    - Keep existing `ritual_type` column for backward compatibility (will be deprecated)

  2. Data Migration
    - No data migration needed as this is additive change
    - New submissions will use the new columns
*/

-- Add new columns for separate gift card types
ALTER TABLE davanu_kartes_pasutijumi 
ADD COLUMN IF NOT EXISTS specific_ritual_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS custom_price_value text DEFAULT '';