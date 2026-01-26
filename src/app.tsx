import styles from './css/app.module.scss'
import Lyrics from './components/Lyrics';
import TranslationSelect from './components/TranslationSelect';
import Footer from './components/Footer';
import Description from './components/Description';

import React, { useEffect, useRef, useState } from 'react'
import { shouldCacheTrack } from './functions/cacheFunctions';
import { SongData } from './types/songData';
import { getSearchHits, getSongData } from './functions/dataFunctions';
import { SongPipelineState } from './types/songPipelineState';
import { config } from './configDefaults';

const App: React.FC = () => {
	const songGen = useRef<number>(0); // Will use to track data across async calls
	const debounceRef = useRef<number | null>(null); // To stop API spam while spam skipping songs
	const shouldCacheRef = useRef<boolean>(false);

	const [gen, setGen] = useState(songGen.current);
	const [loadingPipeline, setLoadingPipeline] = useState<SongPipelineState>({status: "idle"});

	const [playerState, setPlayerState] = useState<Spicetify.PlayerState | null>(null);
	const [songId, setSongId] = useState<number|null>(null);
	const [searchHits, setSearchHits] = useState<Map<number, string>>(new Map());
	const [songData, setSongData] = useState<SongData|null>(null);
	
	// Initial songchange event listener, debounce and topBar
  	useEffect(() => {
		// Remove topbar
		const topBar = document.querySelector(".main-topBar-container");
		if(!topBar) return;
		topBar.classList.add(styles.disabled)

		// Refresh states
  	  	const update = () => {
			if(debounceRef.current) clearTimeout(debounceRef.current);
			setLoadingPipeline({status: "loading", gen: gen});
			setSearchHits(new Map());
			setSongData(null);
			setSongId(null);
			
			debounceRef.current = setTimeout(() => {
				setPlayerState(Spicetify.Player.data)
				debounceRef.current = null;
			}, config.TRACK_CHANGE_DEBOUNCE);
		}
	  
		update();
  	  	Spicetify.Player.addEventListener("songchange", update)

  	  	return () => {
			if(debounceRef.current) clearTimeout(debounceRef.current);
			Spicetify.Player.removeEventListener("songchange", update)
			
			setLoadingPipeline({status: "idle"});
			topBar.classList.remove(styles.disabled)
		}
  	}, []);

	// Get data for current track
	useEffect(() => {
		if(!playerState?.item) return; 
		const currentGen = ++songGen.current;
		setGen(currentGen);
		setLoadingPipeline({status: "loading", gen: currentGen});
    	setSearchHits(new Map());
    	setSongData(null);

		const uri = playerState.item.uri.split(":").pop(); 
		if(!uri) return; 

		(async () => {
			const shouldCache = await shouldCacheTrack(uri);
			if(currentGen === songGen.current) shouldCacheRef.current = shouldCache;

			const searchResult = await getSearchHits(currentGen, playerState, () => shouldCacheRef.current);
			if(currentGen !== songGen.current) return;

			setSearchHits(searchResult.searchHits);
			const currentSongId = searchResult.searchHits.keys().next().value;
			if(!currentSongId) {
				setLoadingPipeline({status: "empty", gen: currentGen}); // No data found for song
				return;
			}
			
			setSongId(currentSongId);
		})();
	}, [playerState]);

	useEffect(() => {
	  	if (!songId) return;

	  	const currentGen = ++songGen.current;
	  	setGen(currentGen);
	  	setLoadingPipeline({ status: "loading", gen: currentGen });

	  	(async () => {
	  	  	const songResult = await getSongData(currentGen, songId, () => shouldCacheRef.current);
	  	  	if (currentGen !== songGen.current) return;
			
	  	  	setSongData(songResult.songData);
	  	  	setLoadingPipeline({ status: "ready", data: songResult.songData, gen: currentGen });
	  	})();
	}, [songId]);
	
	return (
  		<>
		{loadingPipeline.status === "loading" ? (
    	  <div className={styles.container}>
    	    <p className={styles.title}>Loading…</p>
    	  </div>

    	) : songData && loadingPipeline.status === "ready" ? 
		(
			<div className={styles.container}>
				<TranslationSelect searchHits={searchHits} selectedSongId={songId} setSelectedSongId={setSongId}></TranslationSelect>
  			  	<Description text={songData.description}></Description>
  			  	<Lyrics lyrics={songData.lyrics} annotations={songData.annotations}></Lyrics>
				<Footer url={songData.url}></Footer>
  			</div>

		 ) : loadingPipeline.status === "empty" && (
			<div className={styles.container}>
				<p className={styles.title}>No data found for current song ;-;</p>
			</div>
		 )}
  		</>
  	);
};

export default App;
