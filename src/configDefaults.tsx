export const config = {
    "PROXY": "https://genius-annotations-proxy.melonthug.workers.dev/?url=",
    "VERSION": "v1.1.1",
    "INSTALL_COMMAND": `iwr -useb "https://raw.githubusercontent.com/MelonThug/genius-annotations/refs/heads/main/install.ps1" | iex`,
    "TRACK_CHANGE_DEBOUNCE": 727, //WYSI
    "SONG_CACHE_TTL": 604800000, // 7 days
    "ANNOTATIONS_CACHE_TTL": 604800000, // 7 days
    "TRACK_CACHE_TTL": 259200000, // 3 days
    "SEARCH_CACHE_TTL": 86400000, // 1 day
    "TRACK_CACHE_THRESHOLD": 3
}