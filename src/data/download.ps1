$files = Get-Content -Raw -Path json_files.json | ConvertFrom-Json

foreach ($file in $files) {
    if ($file.name -ne "cn.json") {
        $url = $file.download_url
        $name = $file.name
        Invoke-WebRequest -Uri $url -OutFile $name
        Write-Host "Downloaded $name"
    }
}