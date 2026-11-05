# Records the OTP flow in Expo Go on the Pixel_9a emulator.
# Start Metro first, from app/: npx expo start
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ShotDir = Join-Path $ProjectRoot "submission\screenshots"
$VideoPath = Join-Path $ProjectRoot "submission\recording.mp4"
New-Item -ItemType Directory -Force -Path $ShotDir | Out-Null

$configPath = Join-Path $PSScriptRoot "test-config.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
if ($config.countryCode -ne "+92") {
  throw "countryCode in scripts/test-config.json must be +92. The phone screen defaults to that code."
}

$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$adb = Join-Path $sdk "platform-tools\adb.exe"
$emulator = Join-Path $sdk "emulator\emulator.exe"
if (-not (Test-Path $adb)) { throw "adb not found at $adb" }

function Invoke-Adb {
  param(
    [switch]$AllowFail,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Cmd
  )
  & $adb @Cmd
  if (-not $AllowFail -and $LASTEXITCODE -ne 0) {
    throw "adb failed ($LASTEXITCODE): $($Cmd -join ' ')"
  }
}

function Wait-Boot {
  Invoke-Adb wait-for-device | Out-Null
  for ($i = 0; $i -lt 90; $i++) {
    $boot = (Invoke-Adb shell getprop sys.boot_completed)
    if ($boot -match "1") { return }
    Start-Sleep -Seconds 2
  }
  throw "Emulator did not finish booting."
}

$devices = Invoke-Adb devices
if ($devices -notmatch "emulator-\d+\s+device") {
  Write-Host "Starting Pixel_9a emulator..."
  Start-Process -FilePath $emulator -ArgumentList @("-avd", "Pixel_9a", "-netdelay", "none", "-netspeed", "full")
  Wait-Boot
} else {
  Wait-Boot
}

Invoke-Adb shell input keyevent 224 | Out-Null
Invoke-Adb shell wm dismiss-keyguard | Out-Null
Invoke-Adb shell input keyevent 82 | Out-Null
Invoke-Adb shell settings put global window_animation_scale 0 | Out-Null
Invoke-Adb shell settings put global transition_animation_scale 0 | Out-Null
Invoke-Adb shell settings put global animator_duration_scale 0 | Out-Null

function Get-UiXml {
  $local = Join-Path $env:TEMP "otp-ui.xml"
  for ($i = 0; $i -lt 6; $i++) {
    & $adb shell uiautomator dump /sdcard/ui.xml 2>&1 | Out-Null
    & $adb pull /sdcard/ui.xml $local 2>&1 | Out-Null
    if (Test-Path $local) {
      $raw = [System.IO.File]::ReadAllText($local)
      if ($raw -match "<hierarchy") { return $raw }
    }
    Start-Sleep -Milliseconds 600
  }
  throw "uiautomator dump failed"
}

function Find-Node {
  param([string]$Xml, [string]$Label)
  foreach ($tag in [regex]::Matches($Xml, "<node[^>]*>")) {
    $text = $tag.Value
    $escaped = [regex]::Escape($Label)
    $hit = $text -match "content-desc=`"$escaped`"" -or $text -match "text=`"$escaped`""
    if (-not $hit) { continue }
    if ($text -match 'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
      $x1 = [int]$Matches[1]; $y1 = [int]$Matches[2]; $x2 = [int]$Matches[3]; $y2 = [int]$Matches[4]
      if (($x2 - $x1) -lt 4 -or ($y2 - $y1) -lt 4) { continue }
      return @{ X = [int](($x1 + $x2) / 2); Y = [int](($y1 + $y2) / 2) }
    }
  }
  return $null
}

function Wait-ForLabel {
  param([string]$Label, [int]$TimeoutSec = 40)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  do {
    try {
      $xml = Get-UiXml
      $node = Find-Node -Xml $xml -Label $Label
      if ($node) { return $xml }
    } catch {
      Start-Sleep -Milliseconds 400
    }
    Start-Sleep -Milliseconds 500
  } while ((Get-Date) -lt $deadline)
  throw "Timed out waiting for '$Label'. Is Metro running and the app open?"
}

function Tap-Label {
  param([string]$Label)
  $xml = Wait-ForLabel $Label 15
  $node = Find-Node -Xml $xml -Label $Label
  Invoke-Adb shell input tap $node.X $node.Y | Out-Null
  Start-Sleep -Milliseconds 400
}

function Type-Digits {
  param([string]$Label, [string]$Digits)
  if ($Digits -notmatch "^\d+$") { throw "Only digits can be typed into $Label" }
  Tap-Label $Label
  1..16 | ForEach-Object { Invoke-Adb shell input keyevent 67 | Out-Null }
  Invoke-Adb shell input text $Digits | Out-Null
  Invoke-Adb shell input keyevent 111 | Out-Null
  Start-Sleep -Milliseconds 300
}

function Shot {
  param([string]$Name)
  $remote = "/sdcard/$Name"
  Invoke-Adb shell screencap -p $remote | Out-Null
  Invoke-Adb pull $remote (Join-Path $ShotDir $Name) | Out-Null
  Invoke-Adb shell rm $remote | Out-Null
  Write-Host "Saved $Name"
}

function Enter-PhoneAndSend {
  Wait-ForLabel "Enter your number" 60 | Out-Null
  Type-Digits "phone-number" $config.nationalNumber
  Shot "01-phone-entered.png"
  Tap-Label "send-otp"
  Wait-ForLabel "Enter the code" 45 | Out-Null
  Start-Sleep -Seconds 1
  Shot "02-otp-screen.png"
}

Write-Host "Opening the project in Expo Go..."
Invoke-Adb -AllowFail shell am force-stop host.exp.exponent | Out-Null
Start-Sleep -Seconds 1
Invoke-Adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8081" | Out-Null
Wait-ForLabel "Enter your number" 90 | Out-Null

Write-Host "Recording..."
Invoke-Adb -AllowFail shell rm /sdcard/otp-flow.mp4 | Out-Null
$recorder = Start-Process -FilePath $adb -ArgumentList @("shell", "screenrecord", "--time-limit", "170", "--bit-rate", "8000000", "/sdcard/otp-flow.mp4") -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 1

Enter-PhoneAndSend

$sms = "Your verification code is $($config.otp)"
Invoke-Adb emu sms send $config.smsSender $sms | Out-Null
Start-Sleep -Seconds 2
Invoke-Adb shell cmd statusbar expand-notifications | Out-Null
Start-Sleep -Seconds 2
Shot "03-sms-received.png"
Invoke-Adb shell cmd statusbar collapse | Out-Null
Start-Sleep -Milliseconds 800

Type-Digits "otp-code" $config.otp
Shot "04-otp-entered.png"
Tap-Label "verify-otp"
Wait-ForLabel "Phone verified" 45 | Out-Null
Start-Sleep -Seconds 1
Shot "05-success.png"

Tap-Label "start-over"
Wait-ForLabel "Enter your number" 30 | Out-Null
Type-Digits "phone-number" $config.nationalNumber
Tap-Label "send-otp"
Wait-ForLabel "Enter the code" 45 | Out-Null
Type-Digits "otp-code" $config.wrongOtp
Tap-Label "verify-otp"
Wait-ForLabel "Verification failed" 45 | Out-Null
Start-Sleep -Seconds 1
Shot "06-failure.png"

Start-Sleep -Seconds 1
$recPid = (Invoke-Adb -AllowFail shell pidof screenrecord)
if ($recPid) {
  if ($recPid -match "\d") {
    Invoke-Adb -AllowFail shell kill -2 (($recPid | Out-String).Trim()) | Out-Null
  }
}
if ($recorder -and -not $recorder.HasExited) {
  Wait-Process -Id $recorder.Id -Timeout 15 -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
Invoke-Adb pull /sdcard/otp-flow.mp4 $VideoPath | Out-Null
Write-Host "Saved recording to $VideoPath"