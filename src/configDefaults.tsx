export const config = {
    "PROXY": "https://spicetify-proxy.melonthugmydude.workers.dev/?url=",
    "VERSION": "v1.1.0",
    "INSTALL_COMMAND": `iwr -useb "https://raw.githubusercontent.com/aamiryatali/genius-annotations/refs/heads/main/install.ps1" | iex`,
    "SONG_CACHE_TTL": 604800000, // 7 days
    "ANNOTATIONS_CACHE_TTL": 604800000, // 7 days
    "TRACK_CACHE_TTL": 259200000, // 3 days
    "SEARCH_CACHE_TTL": 86400000, // 1 day
    "TRACK_CACHE_THRESHOLD": 3
}