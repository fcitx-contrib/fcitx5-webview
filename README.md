# Fcitx5 webview

Customizable candidate window for [fcitx5-macos](https://github.com/fcitx-contrib/fcitx5-macos),
powered by [webview](https://github.com/webview/webview).

It can be developed independently of fcitx5.

## Tweak style
To change style, you don't need to build the project.
Just edit [index.html](index.html) and view it in a browser.

Execute the following JavaScript code to show candidates:
```js
_select = console.log
_resize = console.log
setCandidates(["虚假的", "🀄", "candidates"], ["1", "2", "3"], 0)
setLayout(1) // vertical
```

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

## Notes for Developers

This library, fcitx5-webview, is intended to be a generic and cross-platform webview UI for input methods, regardless of the input method framework.
So disregarding the first part of its name,

1. Do NOT depend on fcitx5 directly.
2. The API defined in [candidate_window.hpp](include/candidate_window.hpp) should be abstract enough to support non-web, native UI implementations.
