import React from "react";
import styles from '../css/app.module.scss'

export default function TranslationSelect(
    {searchHits, selectedSongId, setSelectedSongId}: 
    {searchHits: Map<number, string>, selectedSongId: number|null, setSelectedSongId: React.Dispatch<React.SetStateAction<number | null>>}
){
    if(!selectedSongId) return;
    return (
        <>
            <div className={styles.translation_container}>
                {searchHits.size > 1 ? 
                <select className={styles.translation_select} value={selectedSongId ?? ""} 
                onChange={async (e) => {setSelectedSongId(Number(e.target.value));
                }}>
                    {[...searchHits].map(([id, title]) => (
                        <option className={styles.translation_item} key={id} value={id}>{title}</option>
                    ))}
                </select>
                :
                <p className={styles.title}>{searchHits.values().next().value}</p>
                }
            </div>
        </>
    )
}