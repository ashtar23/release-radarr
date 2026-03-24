alter table public.titles
  add column if not exists search_name text;

update public.titles
set search_name = trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(name), E'([a-z0-9])[''’]s\\y', E'\\1s', 'g'),
          E'[''’]',
          '',
          'g'
        ),
        E'[^a-z0-9\\s-]',
        ' ',
        'g'
      ),
      E'[-_]+',
      ' ',
      'g'
    ),
    E'\\bspiderman\\b',
    'spider man',
    'g'
  )
)
where search_name is null or search_name = '';

alter table public.titles
  alter column search_name set not null;

create index if not exists titles_search_name_trgm_idx
  on public.titles
  using gin (search_name gin_trgm_ops);
