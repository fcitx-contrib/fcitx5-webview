# Fcitx5 webview

Customizable candidate window for
[fcitx5-macos](https://github.com/fcitx-contrib/fcitx5-macos)
and [fcitx5-js](https://github.com/fcitx-contrib/fcitx5-js),
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
_page = console.log
_resize = console.log
_scroll = console.log
_action = console.log
_highlight = console.log
_log = console.log

// Show candidates with labels, and highlight the first one.
// Show paging buttons but disable previous page.
// Not eligible for scroll mode.
setCandidates([
  { text: "虚假的", label: "1", comment: "comment", actions: [{ "id": 1, "text": "删词" }] },
  { text: "🀄", label: "2", comment: "", actions: [] },
  { text: "candidates", label: "3", comment: "", actions: [] }], 0, "",
  true, false, true, 0, false, false)

// Set writing mode. 0=horizontal-tb, 1=vertical-rl, 2=vertical-lr.
setWritingMode(1)

// Set vertical layout. 0 means horizontal.
setLayout(1)

// Show aux-up.
setCandidates([], -1)
updateInputPanel("", "A", "")

// Set theme to 0=system (default), 1=light or 2=dark.
setTheme(1)
```

To change style, just edit [user.scss](./page/user.scss) and refresh the page.
In order to override predefined style in [macos.scss](./page/macos.scss),
add `div` to the selectors so it has higher precedence.

## Build
```sh
cmake -B build -G Ninja -DCMAKE_BUILD_TYPE=Debug
cmake --build build
```

## Preview
```sh
build/preview/preview.app/Contents/MacOS/preview
```

## Notes for Developers

This library, fcitx5-webview, is intended to be a generic and cross-platform webview UI for input methods, regardless of the input method framework.
So disregarding the first part of its name, it does NOT depend on fcitx5 directly.
