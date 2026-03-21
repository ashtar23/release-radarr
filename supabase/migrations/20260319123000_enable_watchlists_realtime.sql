do $$
begin
  alter publication supabase_realtime add table public.watchlists;
exception
  when duplicate_object then
    null;
  when undefined_object then
    raise notice 'supabase_realtime publication not found; skipping watchlists realtime publication update';
end;
$$;
