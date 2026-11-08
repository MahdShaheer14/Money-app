# Budge

Budge is an Android app that parses bank SMS messages into transactions on the
phone. The original source archive also includes a browser prototype and an
older Java/WebView app.

## Project structure

- `android/` — current Kotlin Android app and Gradle project.
  - `app/src/main/java/com/budge/app/` — app, SMS receiver, parser and database.
  - `app/src/main/res/` and `app/src/main/AndroidManifest.xml` — Android resources and manifest.
  - `tests/ParserTest.kt` — original standalone parser test harness.
- `web/` — browser prototype; edit the JS files and `src.html`, then run
  `python3 web/build.py` to regenerate `index.html`. This is separate from the
  native Android app and changes here do not change the APK.
- `legacy-java-app/` — older Java/WebView version, not used by the APK workflow.
- `app-install/INSTALL.md` — historical installation notes from the archive.
- `Budge-Complete.zip` — original archive retained for reference.

## Automatic APK builds

GitHub Actions builds the current native app on every push, pull request and
manual run. After your changes have been committed and pushed to GitHub:

1. Open the repository's **Actions** tab and select **Build Android APK**.
2. Open the run for your commit and wait for it to succeed.
3. Download **Budge-debug-apk** under **Artifacts**, unzip it, and install
   `app-debug.apk` on an Android 6.0 or newer phone. You may need to allow
   installation from the app you use to open the APK.

Artifacts are retained for 30 days. A failed build has no APK artifact; open
its build logs to diagnose the error. You can also start a build from the Actions
tab using **Run workflow** (when the workflow exists on the default branch).

**Signing:** This is a debug APK, not a production release. GitHub's runner
creates a debug signing key; it may differ between runs. Android cannot update
an existing installation signed with a different key, including the original
release APK. Uninstalling the existing app may be necessary and deletes its app
data. Use a secure, consistent release signing key for production updates.

The original ZIP already contains a release keystore and its password. Treat
that key as exposed, especially if the repository was public; do not use it for
new production releases. Removing the ZIP alone does not erase it from Git
history. The extracted copy of the key and old APK are intentionally not added
as separate files. The Pages workflow publishes only `web/`, not the archive.

## Build locally

Install JDK 17, Gradle 8.6, and Android SDK platform 34 and build-tools 34.0.0.
Set `ANDROID_HOME` to the SDK directory (or set `sdk.dir` in
`android/local.properties`), then run:

```sh
cd android
gradle --no-daemon assembleDebug
```

The output is `android/app/build/outputs/apk/debug/app-debug.apk`. Android
Studio can also open the `android/` directory as a Gradle project. The app
requests SMS permissions and does not request internet access.
