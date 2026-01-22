import { openDB } from "idb";
import { config } from "../configDefaults";

export const dbPromise = openDB('genius-annotations-cache', 1, {
    upgrade(db) {
        if(!db.objectStoreNames.contains('tracks')) {
            db.createObjectStore('tracks', {keyPath: 'uri'})
        }
        if(!db.objectStoreNames.contains('songs')) {
            db.createObjectStore('songs', {keyPath: 'songId'})
        }
        if(!db.objectStoreNames.contains('annotations')) {
            db.createObjectStore('annotations', {keyPath: 'songId'})
        }
        if(!db.objectStoreNames.contains('searches')) {
            db.createObjectStore('searches', {keyPath: 'query'})
        }
    },
});

export async function clearCache(): Promise<void> {
    const db = await dbPromise;
    const stores = ['tracks', 'songs', 'annotations', 'searches'];

    for (const name of stores) {
        const transaction = db.transaction(name, "readwrite");
        const store = transaction.objectStore(name);
        await store.clear();
        await transaction.done;
    }

    console.log("[Genius Annotations] Cache cleared successfully.");
}


export async function cleanupCache(): Promise<void> {
    const db = await dbPromise;
    const now = Date.now();
    const stores = [
        { name: "songs", ttl: config.SONG_CACHE_TTL },
        { name: "annotations", ttl: config.ANNOTATIONS_CACHE_TTL },
        { name: "searches", ttl: config.SEARCH_CACHE_TTL },
        { name: "tracks", ttl: config.TRACK_CACHE_TTL },
    ];

    for (const { name, ttl } of stores) {
        const transaction = db.transaction(name, "readwrite");
        const store = transaction.objectStore(name);
        const allEntries: Array<any> = await store.getAll();

        for (const entry of allEntries) {
            if (now - entry.cachedAt > ttl) {
                await store.delete(entry[store.keyPath as string]);
            }
        }

        await transaction.done;
    }
}

export async function getCacheStats(){
    const db = await dbPromise;
    const stores = ['tracks', 'songs', 'annotations', 'searches'];
    const stats: Record<string, number> = {};

    for(const storeName of stores) {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const count = await store.count();
        stats[storeName] = count;
        await transaction.done;
    }

    return stats;
}

export async function calcCacheSize(){
    const db = await dbPromise;
    const stores = ['tracks', 'songs', 'annotations', 'searches'];
    let total = 0;
    for(const storeName of stores){
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const allObjects = await store.getAll();
        for(const obj of allObjects) {
            total += approximateSize(obj);
        }
    }

    return (total/1024).toFixed(2);
}

export function approximateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return new TextEncoder().encode(str).length;
}