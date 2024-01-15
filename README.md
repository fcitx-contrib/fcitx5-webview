# Fcitx5 webview

Customizable candidate window for [fcitx5-macos](https://github.com/fcitx-contrib/fcitx5-macos),
powered by [webview](https://github.com/webview/webview).

It can be developed independently of fcitx5.

## Build
```sh
./install-deps.sh
PKG_CONFIG_PATH=/tmp/fcitx5/lib/pkgconfig cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Debug
cmake --build build
```
## Preview
```sh
build/preview/preview.app/Contents/MacOS/preview
```
