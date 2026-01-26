import { useEffect, useState } from "react";
import { formatAnnotations, formatLyrics, getDescription, getRawLyrics, normalize } from "./parsingFunctions";
import { cacheAnnotations, cacheSearchHits, cacheSong, getCachedAnnotations, getCachedSearchHits, getCachedSong } from "./cacheFunctions";
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
        const cacheHits = new Map<number, string>(cached.hits);
        //setSelectedSongId(cacheHits?.keys().next().value ?? null) //Default select the first song
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
    //setSelectedSongId(hits?.keys().next().value ?? null) //Default select the first song
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
    const cachedAnnotations = await getCachedAnnotations(songId);
    
    if(cachedSong && cachedAnnotations){
        songData.description = cachedSong.description ?? "";
	    songData.lyrics = cachedSong.lyrics ?? [];
	    songData.annotations = new Map<string, Annotation>(cachedAnnotations.annotations) ?? [];
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
	songData.lyrics = formattedLyrics ?? []
	songData.annotations = formattedAnnotations ?? []
    songData.url = songUrl;
    result.done = true;
    result.success = true;
    
    if(doCache()){
        await cacheSong(songData.id, songData.lyrics, songData.description, songData.url);
        await cacheAnnotations(songData.id, songData.annotations);
    }

    return {result, songData};
}

export { getSearchHits, getSongData }
