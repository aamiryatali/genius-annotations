import React, { cache, useState } from "react"
import styles from '../css/app.module.scss'

export default function Footer({url}: {url: string|null}){
    if(!url) return;

    return (
        <>
            <p>Data sourced from Genius</p>
		    <a href={url}>{url}</a>
        </>
    )
}