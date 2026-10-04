create table if not exists arcade_scores (
  id          text primary key,
  game_id     text not null,
  player_tag  text not null,
  score       integer not null,
  duration_ms integer not null default 0,
  won         boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists arcade_scores_game_score_idx
  on arcade_scores (game_id, score desc, created_at desc);

create table if not exists arcade_challenges (
  id               text primary key,
  game_id          text not null,
  challenger_tag   text not null,
  opponent_tag     text not null,
  entry_monet      integer not null default 0,
  status           text not null,
  challenger_score integer,
  opponent_score   integer,
  winner_tag       text,
  created_at       timestamptz not null default now()
);
create index if not exists arcade_challenges_status_idx
  on arcade_challenges (status, created_at desc);

create table if not exists arcade_plays (
  id          text primary key,
  game_id     text not null,
  player_tag  text not null,
  played_at   timestamptz not null default now()
);
create index if not exists arcade_plays_recent_idx
  on arcade_plays (played_at desc);
