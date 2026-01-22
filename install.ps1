$ErrorActionPreference = "Stop"

$repo = "aamiryatali/genius-annotations"
$customAppsDir = "$env:APPDATA\spicetify\CustomApps"
$targetDir = "$customAppsDir\genius-annotations"
$zip = "$env:TEMP\genius-annotations.zip"
$tempDir = "$env:TEMP\genius-annotations"
$updating = false

try {
  if (-not (Test-Path $customAppsDir )) {
      New-Item -ItemType Directory -Path $customAppsDir | Out-Null
  }

  Write-Host "Fetching latest release from GitHub..."
  $latestRelease = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" -ErrorAction Stop
  $releaseUrl = $latestRelease.assets[0].browser_download_url
  $tagName = $latestRelease.tag_name

  Write-Host "Downloading genius-annotations v$tagName..."
  Invoke-WebRequest -Uri $releaseUrl -OutFile $zip -ErrorAction Stop
  Expand-Archive -Path $zip -DestinationPath $tempDir -Force

  if (Test-Path -Path "$targetDir\*") {
    Write-Host "Warning " -ForegroundColor DarkYellow -NoNewline
    Write-Host "`"$targetDir`" Found existing install. Removing..."
    Remove-Item -Path "$targetDir\*" -Recurse -Force
    $updating = true
  }

  Move-Item -Path "$tempDir\*" -Destination $targetDir -Force
  Remove-Item -Path $zip, $tempDir -Recurse -Force

  spicetify config custom_apps genius-annotations
  spicetify apply

  Write-Host "success " -ForegroundColor DarkGreen -NoNewline
  if($updating) {
    Write-Host "genius-annotations successfully updated to v$tagName!"
  } else {
    Write-Host "genius-annotations v$tagName installation complete!"
  }

} catch {
  Write-Host "Error during installation" -ForegroundColor Red
  Write-Host "Details: $_"
  Write-Host "Installation aborted."
  exit 1
}