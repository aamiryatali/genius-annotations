import { Annotation } from "../types/annotation";
import { config } from "../configDefaults";
import { dbPromise } from "../extensions/caching";
import { approximateSize } from "../extensions/caching";
import { SongData } from "../types/songData";

export async function cacheTrack(uri: string, playCount: number = 0){
    const db = await dbPromise;
    await db.put('tracks', {uri, playCount, cachedAt: Date.now()})
}

export async function cacheSong(data: SongData){
    const db = await dbPromise;
    await db.put('songs', {
        songId: data.id,
        lyrics: data.lyrics ? Array.from(data.lyrics.entries()) : null,
        annotations: data.annotations ?? null,
        description: data.description ?? "",
        url: data.url ?? null,
        cachedAt: Date.now()
    });
}

export async function cacheSearchHits(query: string, hits: Map<number, string>){
    const db = await dbPromise;
    await db.put('searches', {
        query, 
        hits: Array.from(hits.entries()),
        cachedAt: Date.now()
    });
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

    return entry;
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

    return entry;
}

export async function shouldCacheTrack(uri: string): Promise<boolean>{
    let record = await getCachedTrack(uri);
    let count = record?.playCount ?? 0;
    count++;
    await cacheTrack(uri, count);
    
    return count >= config.TRACK_CACHE_THRESHOLD;
}

