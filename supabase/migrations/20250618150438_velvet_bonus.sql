/*
  # Create davanu_kartes_pasutijumi table

  1. New Tables
    - `davanu_kartes_pasutijumi`
      - `id` (uuid, primary key)
      - `vards_uzvards` (text) - Customer's full name
      - `epasts` (text) - Customer's email address
      - `talrunis` (text) - Customer's phone number with country code
      - `ritual_type` (text) - Selected ritual type or custom value
      - `created_at` (timestamptz) - Order creation timestamp

  2. Security
    - Enable RLS on `davanu_kartes_pasutijumi` table
    - Add policy for anonymous users to insert gift card orders
    - Add policy for authenticated users to read their own orders
*/

CREATE TABLE IF NOT EXISTS davanu_kartes_pasutijumi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vards_uzvards text NOT NULL,
  epasts text NOT NULL,
  talrunis text NOT NULL,
  ritual_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE davanu_kartes_pasutijumi ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert gift card orders
CREATE POLICY "Allow anonymous users to insert gift card orders"
  ON davanu_kartes_pasutijumi
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to read their own orders
CREATE POLICY "Users can read their own gift card orders"
  ON davanu_kartes_pasutijumi
  FOR SELECT
  TO authenticated
  USING (epasts = auth.jwt() ->> 'email');