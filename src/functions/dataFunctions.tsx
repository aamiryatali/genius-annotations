import { useEffect, useState } from "react";
import { formatAnnotations, formatLyrics, getDescription, getRawLyrics, normalize } from "./parsingFunctions";
import { cacheSearchHits, cacheSong, getCachedSearchHits, getCachedSong } from "./cacheFunctions";
import { fetchPreloadedState, fetchRawAnnotations, fetchSongHits } from "./apiFunctions";
import { SongData } from "../types/songData";
import { Annotation } from "../types/annotation";
import { Result } from "../types/result";

async function getSearchHits(gen: number, playerState: Spicetify.PlayerState | null, doCache: () => boolean){
    let result:Result = {gen: gen, done: false, success: false};
    let searchHits = new Map<number, string>();

	if(!playerState?.item) {
        result.done = true;
        return {result, searchHits};
    }
    
    const songName = playerState.item.name;
    const songArtist = playerState.item.artists?.[0].name;
    if(!songName || !songArtist) {
        result.done = true;
        return {result, searchHits};
    }
    
    const controller = new AbortController();
    const query = `${songArtist} ${normalize(songName)}`;

    const cached = await getCachedSearchHits(query);
    if(cached){
        searchHits = new Map<number, string>(cached.hits);
        result.done = true;
        result.success = true;
        return {result, searchHits};
    }

    searchHits = await fetchSongHits(songName, songArtist, controller.signal);
    if(!searchHits || searchHits?.size === 0) {
        result.done = true;
        result.success = true;
        return {result, searchHits};
    }

    result.done = true;
    result.success = true;
    if(doCache()){
        await cacheSearchHits(query, searchHits);
    }

    return {result, searchHits};
}

async function getSongData(gen: number, songId: number | null, doCache: () => boolean){
    let result:Result = {gen: gen, done: false, success: false};
    let songData = {} as SongData;

    if(!songId) {
        result.done = true;
        return {result, songData};
    };

    const preStateController = new AbortController();
    const annotationController = new AbortController();

    const cachedSong = await getCachedSong(songId);
    
    if(cachedSong){
        songData.description = cachedSong.description
	    songData.lyrics = cachedSong.lyrics
	    songData.annotations = cachedSong.annotations
        songData.url = cachedSong.url
        result.done = true;
        result.success = true;
        return {result, songData};
    }

    const [preloadedState, rawAnnotations] = await Promise.all([
	    fetchPreloadedState(songId, preStateController.signal),
	    fetchRawAnnotations(songId, annotationController.signal)
	]);

	const rawLyrics = getRawLyrics(preloadedState);
	const songDescription = getDescription(preloadedState);
    const formattedLyrics = formatLyrics(rawLyrics)
    const formattedAnnotations = formatAnnotations(rawAnnotations)
    const songUrl = `https://genius.com/songs/${songId}`

    songData.id = songId;
	songData.description = songDescription ?? ""
	songData.lyrics = formattedLyrics ?? null
	songData.annotations = formattedAnnotations ?? null
    songData.url = songUrl ?? null;
    result.done = true;
    result.success = true;
    
    if(doCache()){
        await cacheSong(songData);
    }

    return {result, songData};
}

export { getSearchHits, getSongData }
