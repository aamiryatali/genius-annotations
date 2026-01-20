$releaseUrl = "https://github.com/aamiryatali/genius-annotations/releases/download/v1.0.0/genius-annotations.zip"
$customAppsDir = "$env:APPDATA\spicetify\CustomApps"
$targetDir = "$customAppsDir\genius-annotations"

if (-not (Test-Path $customAppsDir )) {
    New-Item -ItemType Directory -Path $customAppsDir | Out-Null
}

$zip = "$env:TEMP\genius-annotations.zip"
$tempDir = "$env:TEMP\genius-annotations"

Invoke-WebRequest -Uri $releaseUrl -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $tempDir -Force

if (Test-Path -Path "$targetDir\*") {
  Remove-Item -Path "$targetDir\*" -Recurse -Force
  Write-Host "warning " -ForegroundColor DarkYellow -NoNewline
  Write-Host "`"$targetDir`" Pre-existing file/s were found and deleted."
}

Move-Item -Path "$tempDir\*" -Destination $targetDir -Force
Remove-Item -Path $zip, $tempDir -Recurse -Force

spicetify config custom_apps genius-annotations
spicetify apply

Write-Host "success " -ForegroundColor DarkGreen -NoNewline
Write-Host "genius-annotations installation complete!"