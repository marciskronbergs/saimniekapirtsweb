-- The new booking forms are live and make the id themselves, so the public
-- key no longer needs to read ids; an id is the secret in the office's
-- cancel link.
revoke select (id) on public.reservations from anon, authenticated;
notify pgrst, 'reload schema';
