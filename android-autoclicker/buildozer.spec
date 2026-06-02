[app]
title = AutoClicker Pro
package.name = autoclickerpro
package.domain = org.autoclicker
source.dir = .
source.include_exts = py,png,jpg,kv,atlas,json
version = 1.0

requirements = python3,kivy==2.3.0,android

orientation = portrait
fullscreen = 0

android.permissions = SYSTEM_ALERT_WINDOW, FOREGROUND_SERVICE, VIBRATE, RECEIVE_BOOT_COMPLETED
android.api = 33
android.minapi = 26
android.ndk = 25b
android.sdk = 33
android.ndk_api = 26
android.archs = arm64-v8a, armeabi-v7a

android.allow_backup = True
android.release_artifact = apk

[buildozer]
log_level = 2
warn_on_root = 1
