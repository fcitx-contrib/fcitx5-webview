declare global {
  interface CandidateAction {
    id: number
    text: string
  }

  interface Candidate {
    text: string
    label: string
    comment: string
    actions: CandidateAction[]
  }

  type SCROLL_STATE = 0 | 1 | 2
  type SCROLL_SELECT = 1 | 2 | 3 | 4 | 5 | 6
  type SCROLL_MOVE_HIGHLIGHT = 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17
  type SCROLL_KEY_ACTION = SCROLL_SELECT | SCROLL_MOVE_HIGHLIGHT | 20

  interface FcitxPlugin {
    load: () => void
    unload: () => void
  }

  interface FCITX {
    distribution: string

    // C++ APIs that api.ts calls
    _onload?: () => void
    _log: (s: string) => void
    _copyHTML: (html: string) => void
    _select: (index: number) => void
    _highlight: (index: number) => void
    _page: (next: boolean) => void
    _scroll: (start: number, length: number) => void
    _askActions: (index: number) => void
    _action: (index: number, id: number) => void
    _resize: (dx: number, dy: number, anchorTop: number, anchorRight: number, anchorBottom: number, anchorLeft: number, panelTop: number, panelRight: number, panelBottom: number, panelLeft: number, panelRadius: number, fullWidth: number, fullHeight: number, dragging: boolean) => void

    // JavaScript APIs that webview_candidate_window.mm calls
    setCandidates: (cands: Candidate[], highlighted: number, markText: string, pageable: boolean, hasPrev: boolean, hasNext: boolean, scrollState: SCROLL_STATE, scrollStart: boolean, scrollEnd: boolean) => void
    setLayout: (layout: 0 | 1) => void
    updateInputPanel: (preeditHTML: string, auxUpHTML: string, auxDownHTML: string) => void
    resize: (dx: number, dy: number, dragging: boolean, hasContextmenu: boolean) => void
    setTheme: (theme: 0 | 1 | 2) => void
    setAccentColor: (color: number | null) => void
    setStyle: (style: string) => void
    setWritingMode: (mode: 0 | 1 | 2) => void
    copyHTML: () => void
    scrollKeyAction: (action: SCROLL_KEY_ACTION) => void
    answerActions: (actions: CandidateAction[]) => void

    // Utility functions globally available
    fcitxLog: (...args: unknown[]) => void

    // Plugin manager
    pluginManager: {
      register: (plugin: FcitxPlugin) => void
    }
  }

  interface Window {
    fcitx: FCITX
  }
}

export {}
