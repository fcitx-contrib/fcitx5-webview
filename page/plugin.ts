const unloaders: (() => void)[] = []
const pluginManager = {}

Object.defineProperty(pluginManager, 'register', {
  value: (plugin: FcitxPlugin) => {
    if (typeof plugin.load !== 'function') {
      return window.fcitxLog('Plugin must have a load function')
    }
    if (typeof plugin.unload !== 'function') {
      return window.fcitxLog('Plugin must have an unload function')
    }
    unloaders.push(plugin.unload)
    plugin.load()
  }
})

async function loadPlugins (names: string[]) {
  for (const name of names) {
    window.fcitxLog(`Loading plugin ${name}`)
    const script = document.createElement('script')
    script.src = `fcitx:///file/plugin/${name}/dist/index.js`
    script.classList.add('fcitx-plugin')
    document.head.appendChild(script)
  }
}

function unloadPlugins () {
  for (const unloader of unloaders.reverse()) {
    try {
      unloader()
    } catch (e) {
      window.fcitxLog(`Error unloading plugin: ${e}`)
    }
  }
  unloaders.splice(0, unloaders.length)
  document.head.querySelectorAll('.fcitx-plugin').forEach(script => script.remove())
}

export {
  pluginManager,
  loadPlugins,
  unloadPlugins
}
