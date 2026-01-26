import { Annotation } from "../types/annotation";
import { checkSongMatch, normalize, parseJSStringLiteralJSON } from "./parsingFunctions";

async function fetchSongHits(name: string, artist: string, signal?: AbortSignal){
    const query = new URLSearchParams({q: `${artist} ${normalize(name)}`});
    const proxy = Spicetify.LocalStorage.get("genius-annotations-proxy");
    const fullUrl = proxy + `https://api.genius.com/search?${query.toString()}`
    const hits = new Map<number, string>();

    try {
        const response = await fetch(fullUrl, {signal});
        if (!response.ok) {
            console.warn(`[Genius-Annotations] HTTP error ${response.status} for ${fullUrl}`);
            return hits;
        }

        const data = await response.json();

        if (!data?.response?.hits) {
            console.warn(`[Genius-Annotations] Unexpected response for ${fullUrl}`, data);
            return hits;
        }

        for(const hit of data.response.hits){
            if(checkSongMatch(hit.result.full_title, name, artist)) {
                hits.set(hit.result.id, hit.result.full_title);
            }
        }
    } catch (e) {
        console.error(`[Genius-Annotations] Error searching song for ${fullUrl}`, e);
    }
    return hits;
}

async function fetchRawAnnotations(id: number, signal?: AbortSignal){
    const geniusUrl = `?song_id=${id.toString()}&text_format=plain&per_page=50`
    const proxy = Spicetify.LocalStorage.get("genius-annotations-proxy");
    const fullUrl = proxy + `https://api.genius.com/referents${encodeURIComponent(geniusUrl)}`;
    let annotations: Annotation[] = [];

    try {
        const response = await fetch(fullUrl, {signal})
        if (!response.ok) {
            console.warn(`[Genius-Annotations] HTTP error ${response.status} for ${fullUrl}`);
            return annotations;
        }

        const data = await response.json();

        if (!data?.response?.referents) {
            console.warn(`[Genius-Annotations] Unexpected response for ${fullUrl}`, data);
            return annotations
        }

        for (const referent of data.response.referents){
            const annotationID = referent.id;
            const annotationLyric = referent.fragment;
            const annotationText = referent.annotations[0].body.plain
            annotations.push({id: annotationID, lyrics: annotationLyric, text: annotationText});
        }
    } catch (e) {
        console.error(`[Genius-Annotations] Error getting annotations for ${fullUrl}`, e);
    }
    
    return annotations
}

async function fetchPreloadedState(id: number, signal?: AbortSignal){
    const proxy = Spicetify.LocalStorage.get("genius-annotations-proxy")
    const fullUrl = proxy + `https://genius.com/songs/${id.toString()}`;

    try {
        const response = await fetch(fullUrl, {signal})
        if (!response.ok) {
            console.warn(`[Genius-Annotations] HTTP error ${response.status} for ${fullUrl}`);
            return
        }

        const data = await response.text();
        if (!data) {
            console.warn(`[Genius-Annotations] Unexpected response for ${fullUrl}`, data);
            return
        }

        const match = data.match(
          /window\.__PRELOADED_STATE__\s*=\s*JSON\.parse\(\s*('(?:\\.|[^'])*')\s*\);/
        );

        if(!match) {
            console.warn(`[Genius-Annotations] Failed to find lyric data for ${fullUrl}`); 
            return
        }

        let jsStringLiteral = match[1];
        const jsonString = parseJSStringLiteralJSON(jsStringLiteral);
        const preloadedState = JSON.parse(jsonString);
        return preloadedState;
        
    } catch (e) {
        console.error(`[Genius-Annotations] Error getting song data for ${fullUrl}`, e);
    }
}


export {fetchSongHits, fetchPreloadedState, fetchRawAnnotations}