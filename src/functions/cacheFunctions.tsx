import { Annotation } from "../types/annotation";
import { config } from "../configDefaults";
import { dbPromise } from "../extensions/caching";
import { approximateSize } from "../extensions/caching";

export async function cacheTrack(uri: string, playCount: number = 0){
    const db = await dbPromise;
    await db.put('tracks', {uri, playCount, cachedAt: Date.now()})
}

export async function cacheSong(songId: number, lyrics: Map<number, string>, description: string, url: string){
    const db = await dbPromise;
    await db.put('songs', {
        songId,
        lyrics: Array.from(lyrics.entries()),
        description: description,
        url: url,
        cachedAt: Date.now()
    });
    console.log(`Cached song data for songId: ${songId}`)
}

export async function cacheAnnotations(songId: number, annotations: Map<string, Annotation>){
    const db = await dbPromise;
    await db.put('annotations', {
        songId, 
        annotations: Array.from(annotations.entries()), 
        cachedAt: Date.now()});
    console.log(`Cached annotations for songId: ${songId}`)
}

export async function cacheSearchHits(query: string, hits: Map<number, string>){
    const db = await dbPromise;
    await db.put('searches', {
        query, 
        hits: Array.from(hits.entries()),
        cachedAt: Date.now()
    });
    console.log(`Cached search hits for query: ${query}`)
}

export async function getCachedTrack(uri: string){
    const db = await dbPromise;
    const entry = await db.get('tracks', uri);
    if(!entry) return null;

    const ttl = config.TRACK_CACHE_TTL;
    if(Date.now() - entry.cachedAt > ttl){
        await db.delete('tracks', uri);
        return null;
    }
    console.log(`Retrieving cached track for ${uri}`)
    return entry;
}


export async function getCachedSong(songId: number) {
    const db = await dbPromise;
    const entry = await db.get('songs', songId);
    if(!entry) return null;

    const ttl = config.SONG_CACHE_TTL
    if (Date.now() - entry.cachedAt > ttl){
        await db.delete('songs', songId);
        return null;
    }
    console.log(`Retrieving cached song data for songId: ${songId}`)
    return entry;
}

export async function getCachedAnnotations(songId: number){
    const db = await dbPromise;
    const entry = await db.get('annotations', songId);
    if(!entry) return null;

    const ttl = config.ANNOTATIONS_CACHE_TTL;
    if(Date.now() - entry.cachedAt > ttl){
        await db.delete('annotations', songId);
        return null;
    }

    console.log(`Retrieving cached annotations for songId: ${songId}`)
    return entry
}

export async function getCachedSearchHits(query: string){
    const db = await dbPromise;
    const entry = await db.get('searches', query);
    if(!entry) return null;

    const ttl = config.SEARCH_CACHE_TTL;
    if(Date.now() - entry.cachedAt > ttl){
        await db.delete('searches', query);
        return null;
    }

    console.log(`Retrieving cached search hits for ${query}`)
    return entry;
}

export async function shouldCacheTrack(uri: string): Promise<boolean>{
    let record = await getCachedTrack(uri);
    let count = record?.playCount ?? 0;
    count++;
    await cacheTrack(uri, count);
    
    return count >= config.TRACK_CACHE_THRESHOLD;
}

