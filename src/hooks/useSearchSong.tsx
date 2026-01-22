import { useEffect, useState } from "react";
import { searchSong } from "../functions/apiFunctions";
import { cacheSearchHits, getCachedSearchHits } from "../functions/cacheFunctions";
import { normalize } from "../functions/parsingFunctions";

export function useSearchSong(setIsLoading: React.Dispatch<React.SetStateAction<boolean>>, playerState: Spicetify.PlayerState | null, doCache: () => boolean){
    const [searchHits, setSongSearchHits] = useState<Map<number, string>>(new Map());
    const [selectedSongId, setSelectedSongId] = useState<number | null>(null);

    useEffect(() => {
	    if(!playerState?.item){
            setSelectedSongId(null);
            setSongSearchHits(new Map());      
            return;
        }

        const songName = playerState.item.name;
        const songArtist = playerState.item.artists?.[0].name;
        if(!songName || !songArtist) {
            setSelectedSongId(null);
            setSongSearchHits(new Map());
            setIsLoading(false);
            return;
        };

        const query = `${songArtist} ${normalize(songName)}`;
        (async () => {
            const cached = await getCachedSearchHits(query);
            if(cached){
                const cacheHits = new Map<number, string>(cached.hits);
                setSongSearchHits(cacheHits);
                setSelectedSongId(cacheHits?.keys().next().value ?? null) //Default select the first song
                return;
            }

            const hits = await searchSong(songName, songArtist);
            if(hits.size === 0) {
                setSelectedSongId(null);
                setSongSearchHits(new Map());
                setIsLoading(false);
                return;
            }
            setSongSearchHits(hits);
            setSelectedSongId(hits?.keys().next().value ?? null) //Default select the first song

            if(doCache()){
                await cacheSearchHits(query, hits);
            }
        })();
	}, [playerState]); 

    return {selectedSongId, setSelectedSongId, searchHits};
}