import styles from './css/app.module.scss'
import React, { useEffect, useRef, useState } from 'react'
import Lyrics from './components/Lyrics';
import Description from './components/Description';
import { shouldCacheTrack } from './functions/cacheFunctions';
import TranslationSelect from './components/TranslationSelect';
import Footer from './components/Footer';
import { Annotation } from './types/annotation';
import { SongData } from './types/songData';
import { getSearchHits, getSongData } from './functions/dataFunctions';
import { SongPipelineState } from './types/songPipelineState';
import { config } from './configDefaults';

const App: React.FC = () => {
	const songGen = useRef<number>(0); // Will use to track data cross async calls
	const debounceRef = useRef<number | null>(null); // To stop API spam while spam skipping songs
	const [gen, setGen] = useState(songGen.current);
	const [loadingPipeline, setLoadingPipeline] = useState<SongPipelineState>({status: "loading", gen: gen});

	const [playerState, setPlayerState] = useState<Spicetify.PlayerState | null>(null);
	const [songId, setSongId] = useState<number|null>(null);
	const [searchHits, setSearchHits] = useState<Map<number, string>>(new Map());
	const [songData, setSongData] = useState<SongData|null>(null);
	
	// Initial songchange event listener and debounce
  	useEffect(() => {
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
			Spicetify.Player.removeEventListener("songchange", update)
			if(debounceRef.current) clearTimeout(debounceRef.current);
			setLoadingPipeline({status: "loading", gen: gen});
		}
  	}, []);

	// Get search results for current track
	useEffect(() => {
		songGen.current++;
		const currentGen = songGen.current
		setGen(currentGen);

		(async () => {
			const searchResult = await getSearchHits(currentGen, playerState, () => false)
			if(currentGen !== songGen.current) return;

			setSearchHits(searchResult.searchHits);

			const currentSongId = searchResult.searchHits.keys().next().value
			if(currentSongId) {
				setSongId(currentSongId);
			} else if (currentGen === songGen.current && currentGen !== 1) {
				setLoadingPipeline({status: "empty", gen: currentGen})
			}
			
		})();
	}, [playerState])

	// Get data for current track if search was successful
	useEffect(() => {
		const currentGen = songGen.current;

		(async () => {
			const songDataResult = await getSongData(currentGen, songId, () => false);
			if(currentGen !== songGen.current) return;

			setSongData(songDataResult.songData);
			if (currentGen === songGen.current && songData) {
				setLoadingPipeline({status: "ready", data: songDataResult.songData, gen: currentGen})
			}
		})();
	}, [songId])

	useEffect(() => {
		console.log(`Loading state changed to: ${loadingPipeline.status}`);
	}, [loadingPipeline])
	return (
  		<>
		{loadingPipeline.status === "loading" ? (
    	  <div className={styles.container}>
    	    <p className={styles.title}>Loading…</p>
    	  </div>

    	) : songId && songData && loadingPipeline.status === "ready" ? 
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
