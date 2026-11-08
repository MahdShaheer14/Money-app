#!/usr/bin/env python3
"""
Build Budge as an installable Android APK — no Gradle, no Android Studio.

Pipeline:
    index.html  ->  assets/
    Java        ->  javac -> class files -> d8 -> classes.dex
    resources   ->  aapt2 compile + link -> base APK
    dex + assets->  zip into the APK
    sign        ->  zipalign + apksigner

Requires:
    JDK 17          (JAVA_HOME)
    Android SDK     (ANDROID_HOME) with platforms;android-34 and build-tools;34.0.0

Usage:
    python3 build_apk.py
"""

import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app" / "src" / "main"
BUILD = ROOT / "build"
OUT = ROOT / "Budge.apk"

JAVA_HOME = os.environ.get("JAVA_HOME", "/home/user/jdk17")
ANDROID_HOME = os.environ.get("ANDROID_HOME", "/home/user/android-sdk")
BUILD_TOOLS = Path(ANDROID_HOME) / "build-tools" / "34.0.0"
PLATFORM = Path(ANDROID_HOME) / "platforms" / "android-34" / "android.jar"

JAVAC = Path(JAVA_HOME) / "bin" / "javac"
JAR = Path(JAVA_HOME) / "bin" / "jar"
KEYTOOL = Path(JAVA_HOME) / "bin" / "keytool"
AAPT2 = BUILD_TOOLS / "aapt2"
D8 = BUILD_TOOLS / "d8"
ZIPALIGN = BUILD_TOOLS / "zipalign"
APKSIGNER = BUILD_TOOLS / "apksigner"

PACKAGE = "com.budge.app"
VERSION_NAME = "1.0"
VERSION_CODE = "1"
MIN_SDK = "23"
TARGET_SDK = "34"


def jdk_env():
    env = dict(os.environ)
    env["JAVA_HOME"] = str(JAVA_HOME)
    env["PATH"] = str(Path(JAVA_HOME) / "bin") + os.pathsep + env.get("PATH", "")
    return env


def run(cmd, **kw):
    printable = " ".join(str(c) for c in cmd[:6])
    print("  $ " + printable + (" …" if len(cmd) > 6 else ""))
    kw.setdefault("env", jdk_env())
    res = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, **kw)
    if res.returncode != 0:
        print(res.stdout[-3000:])
        print(res.stderr[-3000:])
        raise SystemExit("FAILED: " + printable)
    return res


def check_tools():
    missing = [str(p) for p in [JAVAC, AAPT2, D8, ZIPALIGN, APKSIGNER, PLATFORM] if not Path(p).exists()]
    if missing:
        print("Missing build tools:")
        for m in missing:
            print("  " + m)
        print("\nSet JAVA_HOME (JDK 17) and ANDROID_HOME (SDK with platform 34).")
        raise SystemExit(1)


def clean():
    if BUILD.exists():
        shutil.rmtree(BUILD)
    BUILD.mkdir(parents=True)


def stage_assets():
    print("• staging web app")
    assets = BUILD / "assets"
    assets.mkdir()
    src = (ROOT.parent / "budge-app" / "index.html")
    if not src.exists():
        src = ROOT / "index.html"
    shutil.copy(src, assets / "index.html")
    print("    index.html  %.1f KB" % ((assets / "index.html").stat().st_size / 1024))


def compile_java():
    print("• compiling Java")
    java_files = sorted(APP.rglob("*.java"))
    classes = BUILD / "classes"
    classes.mkdir()
    run([JAVAC, "-source", "8", "-target", "8", "-nowarn",
         "-bootclasspath", PLATFORM,
         "-classpath", PLATFORM,
         "-d", classes] + java_files)

    print("• dexing")
    class_files = [str(p) for p in classes.rglob("*.class")]
    dex_dir = BUILD / "dex"
    dex_dir.mkdir()
    env = dict(os.environ)
    env["JAVA_HOME"] = str(JAVA_HOME)
    env["PATH"] = str(Path(JAVA_HOME) / "bin") + os.pathsep + env.get("PATH", "")
    res = subprocess.run([str(D8), "--release", "--min-api", MIN_SDK,
                          "--lib", str(PLATFORM),
                          "--output", str(dex_dir)] + class_files,
                         capture_output=True, text=True, env=env)
    if res.returncode != 0:
        print(res.stdout[-2000:]); print(res.stderr[-2000:])
        raise SystemExit("d8 failed")
    return dex_dir / "classes.dex"


def compile_resources():
    print("• compiling resources")
    res = APP / "res"
    res_zip = BUILD / "res.zip"
    run([AAPT2, "compile", "--dir", str(res), "-o", str(res_zip)])

    print("• linking APK")
    base = BUILD / "base.apk"
    run([AAPT2, "link",
         "-o", str(base),
         "-I", str(PLATFORM),
         "--manifest", str(APP / "AndroidManifest.xml"),
         "--min-sdk-version", MIN_SDK,
         "--target-sdk-version", TARGET_SDK,
         "--version-code", VERSION_CODE,
         "--version-name", VERSION_NAME,
         "--auto-add-overlay",
         "-R", str(res_zip)])
    return base


def package_apk(base, dex):
    print("• packaging")
    unsigned = BUILD / "unsigned.apk"
    shutil.copy(base, unsigned)

    with zipfile.ZipFile(unsigned, "a", zipfile.ZIP_DEFLATED) as z:
        z.write(dex, "classes.dex")
        for f in (BUILD / "assets").rglob("*"):
            if f.is_file():
                z.write(f, "assets/" + str(f.relative_to(BUILD / "assets")))

    print("• zipaligning")
    aligned = BUILD / "aligned.apk"
    run([ZIPALIGN, "-f", "-p", "4", str(unsigned), str(aligned)])
    return aligned


def sign(aligned):
    print("• signing")
    ks = ROOT / "budge-release.jks"
    if not ks.exists():
        run([KEYTOOL, "-genkeypair", "-v",
             "-storetype", "JKS",
             "-keystore", str(ks),
             "-alias", "budge",
             "-keyalg", "RSA", "-keysize", "2048",
             "-validity", "10000",
             "-storepass", "budge123", "-keypass", "budge123",
             "-dname", "CN=Budge, OU=Personal, O=Budge, L=Karachi, C=PK"])

    signed = BUILD / "signed.apk"
    run([APKSIGNER, "sign",
         "--ks", str(ks),
         "--ks-type", "JKS",
         "--ks-pass", "pass:budge123",
         "--key-pass", "pass:budge123",
         "--ks-key-alias", "budge",
         "--out", str(signed), str(aligned)])

    shutil.copy(signed, OUT)
    return OUT


def main():
    check_tools()
    clean()
    stage_assets()
    compile_java()
    dex = BUILD / "dex" / "classes.dex"
    base = compile_resources()
    aligned = package_apk(base, dex)
    apk = sign(aligned)
    size = apk.stat().st_size / (1024 * 1024)
    print("\n✓ %s  (%.1f MB)" % (apk.name, size))
    print("  signed with budge-release.jks — keep that file, it identifies the app")


if __name__ == "__main__":
    main()
