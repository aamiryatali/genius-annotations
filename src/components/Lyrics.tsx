import styles from '../css/app.module.scss'
import React, { useState } from "react"
import { Annotation } from '../types/annotation';

export default function Lyrics({lyrics, annotations}: {lyrics: Map<number, string>, annotations: Map<string, Annotation>}){
    const [hoveredAnnotationId, setHoveredAnnotationId] = useState<number | null>(null);
    const [selectedAnnotation, setSelectedAnnotation] = useState<{annotationId: number, lyricIndex: number} | null>();

    return (
            <div className={styles.lyrics_container} onClick={() => setSelectedAnnotation(null)}>
                {Array.from(lyrics).map(([lyricIndex, line]) => {
                    if(line === "\n") return <br></br>;

                    if(line === "") return " ";

                    const normalized = line.toLowerCase();
                    const annotation = new Map<string, Annotation>(annotations).get(normalized);
                    return (
                        <>
                            <span
                            className=
                            {`
                            ${annotation ? styles.lyrics_text_annotated : styles.lyrics_text}
                            `}
                            data-annotation-id={annotation?.id}
                            data-lyricIndex={lyricIndex} 
                            onMouseEnter={() => annotation && setHoveredAnnotationId(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotationId(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                annotation?.id === selectedAnnotation?.annotationId ? setSelectedAnnotation(null) :
                                annotation && setSelectedAnnotation({annotationId: annotation?.id, lyricIndex: lyricIndex})}
                            }
                            >
                                {line}
                            </span>

                            {selectedAnnotation?.annotationId === annotation?.id && 
                            selectedAnnotation?.lyricIndex === lyricIndex && 
                            (
                                <div className={styles.annotation_container}>
                                    <p className={styles.annotation_text}>{annotation?.text}</p>
                                </div>
                            )}
                        </>
                    );
                })}
            </div>
    )
}


