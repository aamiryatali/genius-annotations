import { SongData } from "./songData";

type SongPipelineState =
  | { status: "idle" }
  | { status: "loading"; gen: number }
  | { status: "ready"; gen: number; data: SongData }
  | { status: "empty"; gen: number }
  | { status: "error"; gen: number; error: string };

export { SongPipelineState }
