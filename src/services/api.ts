import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { uid } from "@/lib/utils";

const scoreInput = z.object({
  gameId: z.string().min(1).max(80),
  playerTag: z.string().min(1).max(24),
  score: z.number().int().min(0).max(10_000_000),
  durationMs: z.number().int().min(0).max(86_400_000),
  won: z.boolean(),
});

export const listScores = createServerFn({ method: "GET" })
  .validator(z.object({ gameId: z.string().optional(), limit: z.number().optional() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const limit = Math.min(50, data.limit ?? 20);
    if (data.gameId) {
      return sql<{
        id: string;
        game_id: string;
        player_tag: string;
        score: number;
        duration_ms: number;
        won: boolean;
        created_at: string;
      }>`
        select id, game_id, player_tag, score, duration_ms, won, created_at
        from arcade_scores
        where game_id = ${data.gameId}
        order by score desc, created_at asc
        limit ${limit}
      `;
    }
    return sql<{
      id: string;
      game_id: string;
      player_tag: string;
      score: number;
      duration_ms: number;
      won: boolean;
      created_at: string;
    }>`
      select id, game_id, player_tag, score, duration_ms, won, created_at
      from arcade_scores
      order by score desc, created_at asc
      limit ${limit}
    `;
  });

export const submitScore = createServerFn({ method: "POST" })
  .validator(scoreInput)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("sc");
    await sql`
      insert into arcade_scores (id, game_id, player_tag, score, duration_ms, won)
      values (${id}, ${data.gameId}, ${data.playerTag}, ${data.score}, ${data.durationMs}, ${data.won})
    `;
    await sql`
      insert into arcade_plays (id, game_id, player_tag)
      values (${uid("pl")}, ${data.gameId}, ${data.playerTag})
    `;
    return { id };
  });

export const listChallenges = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  return sql<{
    id: string;
    game_id: string;
    challenger_tag: string;
    opponent_tag: string;
    entry_monet: number;
    status: string;
    challenger_score: number | null;
    opponent_score: number | null;
    winner_tag: string | null;
    created_at: string;
  }>`
    select id, game_id, challenger_tag, opponent_tag, entry_monet, status,
           challenger_score, opponent_score, winner_tag, created_at
    from arcade_challenges
    order by created_at desc
    limit 40
  `;
});

export const createChallenge = createServerFn({ method: "POST" })
  .validator(
    z.object({
      gameId: z.string().min(1).max(80),
      challengerTag: z.string().min(1).max(24),
      opponentTag: z.string().min(1).max(24),
      entryMonet: z.number().min(0).max(1_000_000),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const id = uid("ch");
    await sql`
      insert into arcade_challenges (id, game_id, challenger_tag, opponent_tag, entry_monet, status)
      values (${id}, ${data.gameId}, ${data.challengerTag}, ${data.opponentTag}, ${data.entryMonet}, ${"open"})
    `;
    return { id };
  });

export const resolveChallenge = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      challengerScore: z.number().int().min(0),
      opponentScore: z.number().int().min(0),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ challenger_tag: string; opponent_tag: string }>`
      select challenger_tag, opponent_tag from arcade_challenges where id = ${data.id} limit 1
    `;
    const row = rows[0];
    if (!row) return { ok: false as const };
    const winner =
      data.challengerScore === data.opponentScore
        ? null
        : data.challengerScore > data.opponentScore
          ? row.challenger_tag
          : row.opponent_tag;
    await sql`
      update arcade_challenges
      set status = ${"completed"},
          challenger_score = ${data.challengerScore},
          opponent_score = ${data.opponentScore},
          winner_tag = ${winner}
      where id = ${data.id}
    `;
    return { ok: true as const, winner };
  });

export const listRecentPlays = createServerFn({ method: "GET" })
  .validator(z.object({ playerTag: z.string().min(1).max(24) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    return sql<{ game_id: string; played_at: string }>`
      select game_id, max(played_at) as played_at
      from arcade_plays
      where player_tag = ${data.playerTag}
      group by game_id
      order by max(played_at) desc
      limit 8
    `;
  });
