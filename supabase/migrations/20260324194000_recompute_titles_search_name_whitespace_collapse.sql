with normalized as (
  select
    id,
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  regexp_replace(
                    lower(name),
                    E'([a-z0-9])[''’]s\\y',
                    E'\\1s',
                    'g'
                  ),
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
            E'\\s+',
            ' ',
            'g'
          ),
          E'\\bspiderman\\b',
          'spider man',
          'g'
        ),
        E'\\s+',
        ' ',
        'g'
      )
    ) as normalized_search_name
  from public.titles
)
update public.titles as t
set search_name = n.normalized_search_name
from normalized as n
where t.id = n.id
  and t.search_name is distinct from n.normalized_search_name;
