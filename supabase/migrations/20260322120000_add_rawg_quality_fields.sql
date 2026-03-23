alter table public.titles
  add column if not exists rawg_rating double precision,
  add column if not exists rawg_ratings_count integer,
  add column if not exists rawg_metacritic integer,
  add column if not exists rawg_added integer,
  add column if not exists rawg_reviews_count integer,
  add column if not exists rawg_suggestions_count integer,
  add column if not exists rawg_rating_top integer;

alter table public.titles
  drop constraint if exists titles_rawg_rating_range_chk,
  add constraint titles_rawg_rating_range_chk
    check (rawg_rating is null or (rawg_rating >= 0 and rawg_rating <= 5));

alter table public.titles
  drop constraint if exists titles_rawg_metacritic_range_chk,
  add constraint titles_rawg_metacritic_range_chk
    check (rawg_metacritic is null or (rawg_metacritic >= 0 and rawg_metacritic <= 100));

alter table public.titles
  drop constraint if exists titles_rawg_ratings_count_non_negative_chk,
  add constraint titles_rawg_ratings_count_non_negative_chk
    check (rawg_ratings_count is null or rawg_ratings_count >= 0);

alter table public.titles
  drop constraint if exists titles_rawg_added_non_negative_chk,
  add constraint titles_rawg_added_non_negative_chk
    check (rawg_added is null or rawg_added >= 0);

alter table public.titles
  drop constraint if exists titles_rawg_reviews_count_non_negative_chk,
  add constraint titles_rawg_reviews_count_non_negative_chk
    check (rawg_reviews_count is null or rawg_reviews_count >= 0);

alter table public.titles
  drop constraint if exists titles_rawg_suggestions_count_non_negative_chk,
  add constraint titles_rawg_suggestions_count_non_negative_chk
    check (rawg_suggestions_count is null or rawg_suggestions_count >= 0);

alter table public.titles
  drop constraint if exists titles_rawg_rating_top_non_negative_chk,
  add constraint titles_rawg_rating_top_non_negative_chk
    check (rawg_rating_top is null or rawg_rating_top >= 0);
