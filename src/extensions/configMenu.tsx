import { config } from '../configDefaults';
import styles from '../css/app.module.scss'
import { calcCacheSize, cleanupCache, clearCache, getCacheStats } from './caching';
const { React, ReactDOM } = Spicetify;
const { useState, useEffect } = React;

type VersionInfo = {
  isOutdated: boolean;
  latestVersion: string;
  downloadUrl: string;
};

function ConfigPanel({versionInfoParam}: {versionInfoParam: VersionInfo}){
    const [checkedForUpdates, setCheckedForUpdates] = useState(false);
    const [versionInfo, setVersionInfo] = useState(versionInfoParam);
    const [copiedCommand, setCopiedCommand] = useState(false);
    const [clearedCache, setClearedCache] = useState(false);
    const [cacheStats, setCacheStats] = useState({songs: 0, tracks: 0});
    const [cacheSize, setCacheSize] = useState(-1);
    const [proxyUrl, setProxyUrl] = useState(() => {
        const proxy = Spicetify.LocalStorage.get("genius-annotations-proxy")
        if(proxy === null) Spicetify.LocalStorage.set("genius-annotations-proxy", config.PROXY);
        return proxy !== null ? proxy : config.PROXY;
    });

    useEffect(() => {
      async function fetchCacheStats() {
        const stats = await getCacheStats();
        setCacheStats(stats);
      }

      fetchCacheStats();
    }, [])

    return (
    <><div className={styles.config_container_main}>
        <div className={styles.config_container}>
            <p className={styles.config_text_label}>Check for updates</p>
            
            {versionInfo.isOutdated ?
            <>
            <sub>Update available! Powershell install command:</sub>
            <code>{config.INSTALL_COMMAND}</code>
            </> : checkedForUpdates && <sub>No new updates found</sub>
            }

            <div className={`${styles.config_container} ${styles.row}`}>
                <button 
                className={styles.config_button}
                onClick={async () => {
                    setVersionInfo(await checkForUpdates());
                    setCheckedForUpdates(true);
                }}>
                Check for updates
                </button>

                {versionInfo.isOutdated ? 
                <button
                className={styles.config_button}
                onClick={() => {
                    Spicetify.Platform.ClipboardAPI.copy(config.INSTALL_COMMAND)
                    setCopiedCommand(true);
                    setTimeout(() => setCopiedCommand(false), 2000)
                }}>
                Copy Install Command
                </button>
                : ""
                }
            </div>

            {copiedCommand && <sub>Copied install command to clipboard!</sub>}
        </div> 

        <div className={styles.config_container}>
            <p className={styles.config_text_label}>Proxy URL</p>
            <sub>The proxy URL used to bypass CORS. Default: 
                <br></br>
                <code>https://spicetify-proxy.melonthugmydude.workers.dev/?url=</code>
            </sub>
            <input 
            type="text" 
            className={styles.config_input_text}
            id="config-proxy-url" 
            value={proxyUrl}
            onChange={(e) => {setProxyUrl(e.target.value)}}
            />
        </div>

        <div className={styles.config_container}>
            <p className={styles.config_text_label}>Cache</p>
            <sub>Data for frequently viewed songs are cached for faster retrieval and reduced API requests.</sub>
            <sub>Songs cached: <code>{cacheStats.songs || 0}</code></sub>
            <sub>Track references: <code>{cacheStats.tracks || 0}</code></sub>

            {cacheSize !== -1 ? 
            <sub>Cache size: <code>  ~{cacheSize}Kb</code></sub>
            : ""}

            <div className={`${styles.config_container} ${styles.row}`}>
                <button
                className={styles.config_button}
                onClick={async () => {
                    setCacheSize(await calcCacheSize());
                }}>
                Calculate Size
                </button>
                <button
                className={styles.config_button}
                onClick={async () => {
                    clearCache();
                    setClearedCache(true);
                    setCacheSize(await calcCacheSize());
                    setCacheStats(getCacheStats());
                    setTimeout(() => setClearedCache(false), 2000)
                }}>
                Clear Cache
                </button>
            </div>

            {clearedCache && <sub>Cleared cache!</sub>}
        </div>

        <div className={`${styles.config_container} ${styles.row}`}>
                <button 
                className={styles.config_button} 
                style={{backgroundColor: "hsl(142deg 76% 48%)"}} 
                onClick={() => {
                    Spicetify.LocalStorage.set("genius-annotations-proxy", proxyUrl);
                    Spicetify.showNotification("Config saved!");
                    Spicetify.PopupModal.hide()
                }}>
                Save Config
                </button>
        </div>
    </div></>
    )
}

function injectStylesheet(){
    const styleLink = document.createElement("link");
	styleLink.rel = "stylesheet";
	styleLink.href = "/spicetify-routes-genius-annotations.css";
	document.head.appendChild(styleLink);
}

async function checkForUpdates(){
    const repo = "aamiryatali/genius-annotations";
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    const data = await response.json();
    const latestVersion = data.tag_name;

    const isOutdated = latestVersion !== config.VERSION

    return { isOutdated, latestVersion, downloadUrl: data.assets[0].browser_download_url}
}

function openConfigMenu(versionInfo: VersionInfo){
    const container = document.createElement("div");
    ReactDOM.render(<ConfigPanel versionInfoParam={versionInfo}/>, container);

    Spicetify.PopupModal.display({
        title: "Genius Annotations & Lyrics Config",
        content: container
    });
}

(async () => {
    while (!Spicetify?.Menu) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    const versionInfo = await checkForUpdates();
    cleanupCache();
    injectStylesheet();

    const item = new Spicetify.Menu.Item(
        versionInfo.isOutdated ? "Genius Annotations (Update Available)" : "Genius Annotations", 
        false, 
        () => openConfigMenu(versionInfo),
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" width="100%" viewBox="0 0 500 500" enable-background="new 0 0 500 500" xml:space="preserve" style="background: transparent;">
<path fill="#FFFFFF" opacity="1.000000" stroke="none" d=" M162.287506,376.266785   C168.188049,369.325653 173.896103,362.713409 179.484863,356.001831   C189.040894,344.525909 198.548035,333.008972 208.027603,321.469757   C217.373428,310.093292 226.635071,298.647675 235.979675,287.270203   C243.561600,278.038879 251.258957,268.902222 258.819794,259.653839   C268.608734,247.680069 278.284454,235.613754 288.074036,223.640518   C290.454834,220.728668 293.090118,218.024933 296.122620,214.653885   C297.213867,216.056107 298.608887,217.340729 299.384888,218.927979   C304.513702,229.419128 310.582855,239.103256 318.246033,248.129288   C328.858704,260.629364 341.215546,270.286652 355.817230,277.378174   C358.120483,278.496765 360.549683,279.589539 362.420288,281.255951   C363.220032,281.968414 363.411926,284.917236 362.730743,285.495117   C356.649719,290.653931 350.252808,295.437317 344.061218,300.469452   C328.721893,312.936188 313.397705,325.422394 298.150360,338.001282   C282.885681,350.594421 267.804932,363.411255 252.491089,375.943787   C235.356674,389.966278 218.032196,403.756378 200.836716,417.704620   C197.650146,420.289459 194.783310,423.268707 191.594467,425.850464   C184.501831,431.592682 176.663635,434.629761 167.356903,432.178162   C166.488678,431.949432 164.942551,432.500031 164.372437,433.215607   C159.523788,439.301453 154.331985,445.199738 150.232101,451.771301   C146.431229,457.863617 151.858688,465.744690 158.915909,467.168121   C168.038452,469.008118 177.238190,469.461426 185.807983,466.712036   C194.071091,464.061005 202.002975,459.693695 209.296112,454.889771   C217.047592,449.783966 223.912720,443.321655 231.101318,437.374847   C241.197845,429.022430 250.946884,420.215240 261.404938,412.347412   C267.883026,407.473755 275.465546,404.088593 282.434479,399.841949   C291.795258,394.137817 302.075409,390.991516 312.786041,389.797668   C320.960999,388.886475 329.409027,388.452118 337.524292,389.477631   C347.669647,390.759705 357.758392,393.225128 367.568054,396.185425   C374.856140,398.384766 382.110657,401.453003 388.585419,405.428558   C401.168335,413.154541 413.338074,421.586273 425.369995,430.159241   C429.595306,433.169891 433.068207,437.311188 436.617584,441.181183   C445.672333,451.053741 454.595673,461.047211 463.531799,471.027924   C467.164551,475.085327 465.034821,486.765289 460.065216,490.441345   C453.076263,495.611145 446.484589,494.727264 440.645935,488.269684   C431.977661,478.682495 423.489563,468.880707 414.202850,459.918274   C404.066803,450.136078 392.874756,441.695831 380.540253,434.516357   C370.452606,428.644745 360.017792,424.056122 348.951538,421.119720   C332.675262,416.800903 316.458740,416.388672 300.277283,423.069733   C286.770874,428.646423 275.673828,437.616302 264.456451,446.371643   C252.143036,455.982513 240.806778,466.835663 228.668915,476.684357   C219.434326,484.177307 208.903107,490.035706 197.633667,493.522797   C182.489456,498.208832 167.100876,499.309021 151.170990,494.927063   C136.663345,490.936279 127.095985,482.299866 122.297798,468.927490   C119.344742,460.697479 119.616928,451.410248 122.702972,442.855682   C127.293427,430.130829 135.549347,419.925140 145.592514,411.032288   C146.450531,410.272552 147.099518,408.562805 146.913620,407.450073   C145.300110,397.791870 150.395981,390.946991 156.175613,384.277588   C158.288895,381.839020 160.095062,379.134308 162.287506,376.266785  z"/>
<path fill="#FFFFFF" opacity="1.000000" stroke="none" d=" M356.994934,105.997940   C367.996277,101.976852 378.825562,102.252655 390.017578,102.625771   C401.617035,103.012474 411.575134,107.732285 421.990875,111.241287   C427.164581,112.984268 431.815796,116.705986 436.240875,120.130180   C441.264557,124.017555 446.129456,128.242874 450.428467,132.906570   C459.585999,142.841034 466.845551,153.905289 471.607971,166.822678   C475.885925,178.426208 477.482574,190.161041 476.917053,202.258377   C476.386810,213.601425 474.033051,224.561676 467.368195,234.165009   C466.870392,234.882278 466.899475,235.965225 466.680389,236.891769   C450.434723,234.056030 434.898071,229.222656 420.695740,221.578522   C409.622192,215.618439 399.223083,208.201065 389.777313,199.513535   C380.195435,190.700806 371.854492,180.992065 364.756012,170.190765   C356.104767,157.026825 350.405121,142.442001 345.328552,127.633240   C344.033234,123.854698 343.613586,119.748489 343.053131,115.756119   C342.729431,113.450485 342.767181,111.536530 346.178040,110.766685   C349.818390,109.945053 353.131836,107.675018 356.994934,105.997940  z"/>
<path fill="#FFFFFF" opacity="1.000000" stroke="none" d=" M56.825844,157.324829   C42.283802,148.585312 35.983414,135.484177 33.911213,119.501198   C31.791691,103.153290 35.610363,88.206894 42.675365,73.679298   C48.830711,61.022205 57.156578,50.095863 69.078430,42.680016   C77.846779,37.225754 87.491058,33.153992 96.861542,28.711983   C99.114647,27.643915 101.832222,27.161713 104.331802,27.176008   C105.555878,27.183010 107.229057,28.700317 107.903290,29.959965   C110.014320,33.903919 111.861618,38.002827 113.578079,42.138405   C114.447830,44.233948 114.309601,45.804527 111.518730,47.113369   C98.933937,53.015312 89.407463,61.823250 85.538116,75.803001   C84.625862,79.098938 85.144684,80.305717 88.576485,81.325394   C104.350014,86.012123 114.335625,97.075157 117.605438,112.667206   C122.036049,133.794601 109.980553,156.446899 85.029839,161.105179   C75.166809,162.946579 66.065155,161.457352 56.825844,157.324829  z"/>
<path fill="#FFFFFF" opacity="1.000000" stroke="none" d=" M140.208801,132.538544   C139.018112,124.281448 137.081802,116.386131 137.191299,108.519287   C137.425674,91.679787 143.295135,76.493660 152.835754,62.597450   C164.828140,45.130157 181.669006,34.711857 201.380371,28.279987   C203.204254,27.684849 205.178070,27.006149 207.013565,27.164200   C208.442520,27.287245 210.315933,28.323025 211.033783,29.525229   C213.480225,33.622246 215.741806,37.875889 217.524460,42.291573   C217.988678,43.441452 216.862564,46.380501 215.775131,46.832100   C204.971848,51.318604 196.974747,58.811573 191.609131,69.028587   C189.935410,72.215645 189.376053,75.987930 188.157776,79.979912   C201.428726,82.754105 211.304199,90.632629 217.679428,102.481178   C221.926559,110.374634 223.608978,119.378517 221.768784,128.096741   C217.271317,149.403976 203.313354,159.793869 184.477325,161.809799   C163.345032,164.071457 147.133469,151.720871 140.208801,132.538544  z"/>
<path fill="#FFFFFF" opacity="1.000000" stroke="none" d=" M393.223938,231.714859   C402.313080,236.822464 410.976288,241.997437 420.023712,246.378983   C426.999878,249.757462 434.472198,252.105560 441.690521,254.995148   C443.054535,255.541183 444.261658,256.479065 445.941559,257.473083   C424.933044,269.301758 403.635132,270.306274 382.193665,264.428375   C364.616638,259.609924 349.520630,249.780823 337.051788,236.331085   C317.075043,214.782791 309.149139,189.089035 312.146088,160.128662   C313.147278,150.453873 316.953857,141.385712 322.671906,132.248047   C323.815247,135.359665 324.759735,137.647552 325.503235,139.998978   C330.642975,156.254059 338.069031,171.249725 347.541992,185.547226   C356.419250,198.945663 367.341125,210.233765 378.818695,221.126068   C383.016174,225.109497 388.219116,228.033417 393.223938,231.714859  z"/>
</svg>`
    );

    item.register();
})()