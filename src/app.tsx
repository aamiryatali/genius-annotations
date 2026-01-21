import styles from './css/app.module.scss'
import React, { useEffect, useState } from 'react'
import Lyrics from './components/Lyrics';
import Description from './components/Description';
import { usePlayerState } from './hooks/usePlayerState';
import { useSearchSong } from './hooks/useSearchSong';
import { useSongData } from './hooks/useSongData';

const App: React.FC = () => {
	const [isLoading, setIsLoading] = useState(true);  	
	const {playerState, debounceRef} = usePlayerState(setIsLoading, 727);
	const {selectedSongId, setSelectedSongId, searchHits} = useSearchSong(setIsLoading, playerState);
	const {lyrics, annotations, description, url} = useSongData(setIsLoading, selectedSongId);

	useEffect(() => {
		const topBar = document.querySelector(".main-topBar-container");
		if(!topBar) return;
		topBar.classList.add(styles.disabled)

		return () => {topBar.classList.remove(styles.disabled)};
	}, [])

	return (
  		<>
		{isLoading ? (
    	  <div className={styles.container}>
    	    <p className={styles.title}>Loading…</p>
    	  </div>

    	) : selectedSongId ? 
		(
			<div className={styles.container}>
				<div className={styles.translation_container}>
					<select className={styles.translation_select} value={selectedSongId ?? ""} 
					onChange={async (e) => {setSelectedSongId(Number(e.target.value));
  					}}>
						{[...searchHits].map(([id, title]) => (
							<option className={styles.translation_item} key={id} value={id}>{title}</option>
						))}
					</select>
				</div>

  			  	{description !== "" && <Description text={description}></Description>}
  			  	<Lyrics lyrics={lyrics} annotations={annotations}></Lyrics>
				<p>Data sourced from Genius</p>
				<a href={url}>{url}</a>
  			</div>

		 ) : !debounceRef.current && !isLoading && (
			<div className={styles.container}>
				<p className={styles.title}>No data found for current song ;-;</p>
			</div>
		 )}
  		</>
  	);
};

export default App;
