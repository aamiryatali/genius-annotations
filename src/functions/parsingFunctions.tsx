import { Annotation } from "../types/annotation";

function checkSongMatch(title: string, name: string, artist: string): boolean {
    const normalizedTitle = normalize(title);
    const normalizedName = normalize(name);
    const normalizedArtist = normalize(artist);

    const nameWords = normalizedName.split(" ").filter(Boolean);
    const artistWords = normalizedArtist.split(" ").filter(Boolean);

    const nameMatches = nameWords.every(word => normalizedTitle.includes(word));
    const artistMatches = artistWords.every(word => normalizedTitle.includes(word));

    return nameMatches && artistMatches;
}

function formatAnnotations(annotations: Annotation[]){
    for(const annotation of annotations){
        annotation.lyrics = normalizeQuotes(annotation.lyrics);
    }
    const annotationsMap = new Map(annotations.map((annotation) => [annotation.lyrics.toLowerCase(), annotation]))
    return annotationsMap;
}

function formatLyrics(rawLyrics: Element){
    const lyrics = extractLyrics(rawLyrics).map(normalizeQuotes)
    let lyricsMap = new Map<number, string>();
    lyricsMap = new Map(lyrics.map((line, i) => [i, line]));
    return lyricsMap
}

function normalizeQuotes(s: string) {
    return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function normalize(string: string): string {
    // Remove any (feat. …) or [feat. …] anywhere in the string, as well normalize saces
    return string
    .replace(/\s*[\(\[]\s*feat[^\)\]]*[\)\]]/gi, '')
    .replace(/\u00A0/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function getRawLyrics(preloadedState: any){ //Its complex JSON so :any will have to suffice
    const lyricsHtml = preloadedState.songPage.lyricsData.body.html;
    const doc = new DOMParser().parseFromString(lyricsHtml, "text/html");
    const lyricsData = doc.querySelector("p") ?? new Element();
    return lyricsData;
}

function getDescription(preloadedState: any){ 
    const annotationKey = Object.keys(preloadedState.entities.annotations)[0]
    const descriptionHtml = preloadedState.entities.annotations[annotationKey].body.html;
    const doc = new DOMParser().parseFromString(descriptionHtml, "text/html");
    const description = doc.body.textContent || "";
    return description;
}

function extractLyrics(lyricsData: Element){
    let lyrics: string[] = [];
    for(const node of lyricsData.childNodes) {
        if(node.nodeType === Node.TEXT_NODE) {
            node.textContent && lyrics.push(node.textContent.trim());
        }

        if(node.nodeName === "BR") {
            lyrics.push("\n");
        }

        if(node.nodeName === "A") {
            let lyric = "";
            for(const childNode of node.childNodes){
                if (childNode.nodeType == Node.TEXT_NODE){
                    if(childNode.textContent) lyric += childNode.textContent.trim();

                } else if(childNode.nodeName === "BR") {
                    lyric += "\n ";
                }
            }
            lyrics.push(lyric.trim());
            continue;
        }
    }
    return lyrics;
}

function parseJSStringLiteralJSON(jsStringLiteral: String){
    jsStringLiteral = jsStringLiteral.slice(1, -1);

    let jsonString = jsStringLiteral
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');

    jsonString = jsonString.replace(/[\u0000-\u001F]/g, (c) => {
        switch (c) {
            case '\b': return '\\b';
            case '\f': return '\\f';
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            default:
                return '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0');
        }
    });

    jsonString = jsonString.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
    return jsonString;
}

export { extractLyrics, formatAnnotations, formatLyrics, getRawLyrics, getDescription, checkSongMatch, normalize, parseJSStringLiteralJSON}