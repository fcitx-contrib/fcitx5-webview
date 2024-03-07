# Fcitx5 webview

Customizable candidate window for [fcitx5-macos](https://github.com/fcitx-contrib/fcitx5-macos),
powered by [webview](https://github.com/webview/webview).

It can be developed independently of fcitx5.

## Install Node dependencies

You may use [nvm](https://github.com/nvm-sh/nvm)
to install node, then

```sh
npm i -g pnpm
pnpm i
```

## Tweak style
```sh
npm run dev
```
Open http://localhost:1234 with Safari,
as the real candidate window on macOS is rendered by WebKit.

Execute the following JavaScript code to show candidates and more:
```js
// Prerequisite: mock C++ callbacks to avoid throwing error.
_select = console.log
_resize = console.log

// Show candidates with labels, and highlight the first one.
setCandidates(["虚假的", "🀄", "candidates"], ["1", "2", "3"], 0, "")

// Set vertical layout. 0 means horizontal.
setLayout(1)

// Show aux-up.
setCandidates([], [], -1)
updateInputPanel("", "A", "")

// Set theme to 0=system (default), 1=light or 2=dark.
setTheme(1)
```

To change style, just edit [user.scss](./page/user.scss) and refresh the page.
In order to override predefined style in [macos.scss](./page/macos.scss),
add `div` to the selectors so it has higher precedence.

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
