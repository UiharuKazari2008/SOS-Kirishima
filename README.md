# SOS-Kirishima
"Savior of Song" Runtime Application Patcher designed to be used with Kongou LCC to patch configurations for applications prior to launch.

## Important Note!
This is NOT in ANY WAY compatible with a official ALLS/Nu keychip/preboot and is designed to work with a sudo-ALLS setup where sgpreboot does not exist. It is designed to recreate the hardware key requirement to use the game and protect data in transit and from offline ripping. This is not designed to be super high security.

## Patches Config File
* Path is referenced from the X:\ disk if no absolute path is set
* Option Key should match the "accepted_options" array in the games book shelf configuration
  * Protip: Use _version at the end to version the patch per version and use a generic option name
    * Example "no-timer" in LCC options state NVRAM and "no-timer_new" and "no-timer_sun" translate to the same in LCC

```json
{
  "chusanApp.exe": {
    "path": "\\bin\\chusanApp.exe",
    "options": {
      "no-timers_2-15": {
        "patches": [
          {
            "offset": "0xED5976",
            "off": [
              "0x74",
              "0x3D"
            ],
            "on": [
              "0x90",
              "0x90"
            ]
          }
        ]
      }
    }
  }
}
```

## Build EXE
Run this first<br/>
```powershell
npm install pkg -g
npm install resedit-cli -g
```

```powershell
pkg --compress GZip .
npx resedit --in .\build\sos-kirishima.exe --out .\build\savior_of_song_patcher.exe --icon 1,icon.ico --no-grow --company-name "Academy City Research P.S.R." --file-description "KIRISHIMA Application Patcher" --product-version 1.1.0.0 --product-name 'Savior Of Song Application Patcher "KIRISHIMA"'
```
