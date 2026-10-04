export type ArcadeEvent =
  | { type: "GAME_READY" }
  | { type: "GAME_STARTED" }
  | { type: "SCORE_CHANGED"; score: number }
  | { type: "GAME_PAUSED" }
  | { type: "GAME_RESUMED" }
  | { type: "GAME_WON"; score: number; duration: number }
  | { type: "GAME_LOST"; score: number; duration: number }
  | { type: "GAME_COMPLETED"; score: number; won: boolean; duration: number }
  | { type: "GAME_ERROR"; message: string };

type Listener = (event: ArcadeEvent) => void;

const listeners = new Set<Listener>();

function emit(event: ArcadeEvent) {
  for (const listener of listeners) listener(event);
}

export const ArcadeGame = {
  ready() {
    emit({ type: "GAME_READY" });
  },
  started() {
    emit({ type: "GAME_STARTED" });
  },
  updateScore(score: number) {
    emit({ type: "SCORE_CHANGED", score });
  },
  paused() {
    emit({ type: "GAME_PAUSED" });
  },
  resumed() {
    emit({ type: "GAME_RESUMED" });
  },
  won(payload: { score: number; duration: number }) {
    emit({ type: "GAME_WON", ...payload });
    emit({ type: "GAME_COMPLETED", won: true, ...payload });
  },
  lost(payload: { score: number; duration: number }) {
    emit({ type: "GAME_LOST", ...payload });
    emit({ type: "GAME_COMPLETED", won: false, ...payload });
  },
  finished(payload: { score: number; won: boolean; duration: number }) {
    emit({ type: "GAME_COMPLETED", ...payload });
  },
  error(message: string) {
    emit({ type: "GAME_ERROR", message });
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
