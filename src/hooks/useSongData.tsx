import { useEffect, useState } from "react";
import { Annotation } from "../types/annotation";
import { getPreloadedState, getRawAnnotations } from "../functions/apiFunctions";
import { formatAnnotations, formatLyrics, getDescription, getRawLyrics } from "../functions/parsingFunctions";
import { cacheAnnotations, cacheSong, getCachedAnnotations, getCachedSong } from "../functions/cacheFunctions";

export function useSongData(setIsLoading: React.Dispatch<React.SetStateAction<boolean>>, songId: number | null, doCache: () => boolean){
    const [lyrics, setLyrics] = useState<Map<number, string>>(new Map());
    const [annotations, setAnnotations] = useState<Map<string, Annotation>>(new Map());
    const [description, setDescription] = useState<string>("");
    const [url, setUrl] = useState<string>("");

    useEffect(() => {
        if(!songId) return;
        
        (async () => {
            const cachedSong = await getCachedSong(songId);
            const cachedAnnotations = await getCachedAnnotations(songId);
            if(cachedSong && cachedAnnotations){
                setDescription(cachedSong.description ?? "");
		        setLyrics(cachedSong.lyrics ?? []);
		        setAnnotations(new Map<string, Annotation>(cachedAnnotations.annotations) ?? []);
                setUrl(cachedSong.url);
                setIsLoading(false);
                return;
            }

            const [preloadedState, rawAnnotations] = await Promise.all([
			    getPreloadedState(songId),
			    getRawAnnotations(songId)
		    ]);

		    const rawLyrics = getRawLyrics(preloadedState);
		    const songDescription = getDescription(preloadedState);
            const formattedLyrics = formatLyrics(rawLyrics)
            const formattedAnnotations = formatAnnotations(rawAnnotations)
            const songUrl = `https://genius.com/songs/${songId}`

		    songDescription && setDescription(songDescription ?? "");
		    formattedLyrics && setLyrics(formattedLyrics ?? []);
		    formattedAnnotations && setAnnotations(formattedAnnotations ?? []);
            setUrl(songUrl);
            setIsLoading(false);

            if(doCache()){
                await cacheSong(songId, formattedLyrics, songDescription, url);
                await cacheAnnotations(songId, formattedAnnotations);
            }
        })();
    }, [songId])

    return {lyrics, annotations, description, url};
}