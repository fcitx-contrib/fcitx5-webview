declare global {
  type CandidateAction = {
    id: number
    text: string
  }

  type Candidate = {
    text: string
    label: string
    comment: string
    actions: CandidateAction[]
  }

  type SCROLL_STATE = 0 | 1 | 2
  type SCROLL_SELECT = 1 | 2 | 3 | 4 | 5 | 6
  type SCROLL_MOVE_HIGHLIGHT = 10 | 11 | 12 | 13 | 14 | 15
  type SCROLL_KEY_ACTION = SCROLL_SELECT | SCROLL_MOVE_HIGHLIGHT

  interface Window {
    // C++ APIs that api.ts calls
    _onload?: () => void
    _log: (s: string) => void
    _copyHTML: (html: string) => void
    _select: (index: number) => void
    _page: (next: boolean) => void
    _scroll: (start: number, length: number) => void
    _action: (index: number, id: number) => void
    _resize: (dx: number, dy: number, shadowTop: number, shadowRight: number, shadowBottom: number, shadowLeft: number, fullWidth: number, fullHeight: number, enlargedWidth: number, enlargedHeight: number, dragging: boolean) => void

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

    // Utility functions globally available
    fcitxLog: (...args: unknown[]) => void
  }
}

export {}
