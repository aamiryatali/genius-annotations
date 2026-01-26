import { Annotation } from "./annotation"

type SongData = {
    id: number,
    lyrics: Map<number, string>|null,
    description: string,
    annotations: Map<string, Annotation>|null,
    url: string|null
}

export { SongData }