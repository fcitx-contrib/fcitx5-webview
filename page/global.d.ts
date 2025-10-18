import type { COLLAPSE, COMMIT, DOWN, END, HOME, HORIZONTAL, HORIZONTAL_TB, LEFT, PAGE_DOWN, PAGE_UP, RIGHT, SCROLL_NONE, SCROLL_READY, SCROLLING, UP, VERTICAL, VERTICAL_LR, VERTICAL_RL } from './constant'

declare global {
  type DEFAULT_THEME = 'macOS 26' | 'macOS 15'
  type CONFIG_BOOL = 'False' | 'True'
  type HOVER_BEHAVIOR = 'None' | 'Move' | 'Add'
  type PAGING_BUTTONS_STYLE = 'None' | 'Arrow' | 'Triangle'

  interface LIGHT_MODE {
    OverrideDefault: CONFIG_BOOL
    HighlightColor: string
    HighlightHoverColor: string
    HighlightTextColor: string
    HighlightTextPressColor: string
    HighlightLabelColor: string
    HighlightCommentColor: string
    HighlightMarkColor: string
    PanelColor: string
    TextColor: string
    LabelColor: string
    CommentColor: string
    PagingButtonColor: string
    DisabledPagingButtonColor: string
    AuxColor: string
    PreeditColorPreCaret: string
    PreeditColorCaret: string
    PreeditColorPostCaret: string
    BorderColor: string
    DividerColor: string
  }

  interface FONT_FAMILY { [key: string]: string }

  interface STYLE_JSON {
    Basic: {
      DefaultTheme: 'System' | DEFAULT_THEME
    }
    LightMode: LIGHT_MODE
    DarkMode: LIGHT_MODE & {
      SameWithLightMode: CONFIG_BOOL
    }
    Typography: {
      PagingButtonsStyle: PAGING_BUTTONS_STYLE
    }
    ScrollMode: {
      MaxRowCount: string
      MaxColumnCount: string
      Animation: CONFIG_BOOL
    }
    Background: {
      ImageUrl: string
      KeepPanelColorWhenHasImage: CONFIG_BOOL
      Blur: CONFIG_BOOL
      BlurRadius?: string // Exist for JS, not for macOS.
      Shadow: CONFIG_BOOL
    }
    Font: {
      TextFontFamily: FONT_FAMILY
      TextFontSize: string
      LabelFontFamily: FONT_FAMILY
      LabelFontSize: string
      CommentFontFamily: FONT_FAMILY
      CommentFontSize: string
      PreeditFontFamily: FONT_FAMILY
      PreeditFontSize: string
    }
    Caret: {
      Style: 'Blink' | 'Static' | 'Text'
    }
    Highlight: {
      MarkStyle: 'None' | 'Bar' | 'Text'
      HoverBehavior: HOVER_BEHAVIOR
    }
    Size: {
      OverrideDefault: CONFIG_BOOL
      BorderWidth: string
      BorderRadius: string
      Margin: string
      HighlightRadius: string
      TopPadding: string
      RightPadding: string
      BottomPadding: string
      LeftPadding: string
      LabelTextGap: string
      VerticalMinWidth: string
      ScrollCellWidth: string
      HorizontalDividerWidth: string
    }
    Advanced: {
      UserCss: string
    }
  }

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

  type LAYOUT = typeof HORIZONTAL | typeof VERTICAL
  type WRITING_MODE = typeof HORIZONTAL_TB | typeof VERTICAL_RL | typeof VERTICAL_LR

  type SCROLL_STATE = typeof SCROLL_NONE | typeof SCROLL_READY | typeof SCROLLING
  type SCROLL_SELECT = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  type SCROLL_MOVE_HIGHLIGHT = typeof UP | typeof DOWN | typeof LEFT | typeof RIGHT | typeof HOME | typeof END | typeof PAGE_UP | typeof PAGE_DOWN
  type SCROLL_KEY_ACTION = SCROLL_SELECT | SCROLL_MOVE_HIGHLIGHT | typeof COLLAPSE | typeof COMMIT

  interface FcitxPlugin {
    load: () => void
    unload: () => void
  }

  interface FCITX {
    host: { system: string, version: number }
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
    _resize: (epoch: number, dx: number, dy: number, anchorTop: number, anchorRight: number, anchorBottom: number, anchorLeft: number, panelTop: number, panelRight: number, panelBottom: number, panelLeft: number, topLeftRadius: number, topRightRadius: number, bottomRightRadius: number, bottomLeftRadius: number, borderWidth: number, fullWidth: number, fullHeight: number, dragging: boolean) => void

    // JavaScript APIs that webview_candidate_window.mm calls
    setHost: (system: string, version: number) => void
    setCandidates: (cands: Candidate[], highlighted: number, markText: string, pageable: boolean, hasPrev: boolean, hasNext: boolean, scrollState: SCROLL_STATE, scrollStart: boolean, scrollEnd: boolean) => void
    setLayout: (layout: LAYOUT) => void
    updateInputPanel: (preeditHTML: string, auxUpHTML: string, auxDownHTML: string) => void
    resize: (new_epoch: number, dx: number, dy: number, dragging: boolean, hasContextmenu: boolean) => void
    setTheme: (theme: 0 | 1 | 2) => void
    setAccentColor: (color: number | null | string) => void
    setStyle: (style: string) => void
    setWritingMode: (mode: WRITING_MODE) => void
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
