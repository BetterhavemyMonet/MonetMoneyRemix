import { apiBase } from "./backend";

export type ScoreRow = {
  id:string; game_id:string; player_tag:string; score:number;
  duration_ms:number; won:boolean; created_at:string;
};
export type RecentPlay = { game_id:string; played_at:string };

async function json<T>(r:Response):Promise<T>{
  const b=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(b?.error||`Backend request failed (${r.status})`);
  return b as T;
}

export async function listScores({data}:{data:{gameId?:string;limit?:number}}){
  const q=new URLSearchParams();
  if(data.gameId) q.set("gameId",data.gameId);
  if(data.limit) q.set("limit",String(data.limit));
  return json<ScoreRow[]>(await fetch(`${apiBase()}/api/scores?${q}`,{cache:"no-store"}));
}

export async function submitScore({data}:{data:{
  wallet:string; gameId:string; playerTag?:string; score:number;
  durationMs:number; won:boolean;
}}){
  return json<{ok:boolean;id:string;verified:boolean;payoutEligible:boolean}>(
    await fetch(`${apiBase()}/api/scores`,{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({
        wallet:data.wallet,gameId:data.gameId,score:data.score,
        durationMs:data.durationMs,won:data.won
      })
    })
  );
}

export async function listRecentPlays({data}:{data:{playerTag:string}}){
  if(!data.playerTag||data.playerTag==="DISCONNECTED"||data.playerTag==="GUEST") return [];
  const q=new URLSearchParams({playerTag:data.playerTag});
  return json<RecentPlay[]>(await fetch(`${apiBase()}/api/recent-plays?${q}`,{cache:"no-store"}));
}
