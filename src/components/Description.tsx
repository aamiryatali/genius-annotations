import React, { useState } from 'react'
import styles from '../css/app.module.scss'

export default function Description({text}: {text: string|null}){
    const [isExpanded, setIsExpanded] = useState(false);
    const descPreviewLength = 300;
    if(!text) return;

    return (
        <>
            {text !== "" ? 
            <div className={styles.description_container}>
                <u className={styles.title}>Description</u>
                <p className={styles.description_text}>
                    {isExpanded ? text : `${text.slice(0, descPreviewLength)}${text.length > descPreviewLength ? "..." : ""}`}
                </p>
                {text.length > descPreviewLength && 
                <button className={styles.button} onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? "Read Less" : "Read More"}</button>
                }
            </div>
            : ""}
        </>
    )
}