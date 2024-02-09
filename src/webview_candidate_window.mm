#include "webview_candidate_window.hpp"
#include "html_template.hpp"
#import <WebKit/WKWebView.h>
#include <algorithm>
#include <sstream>

@interface NotificationListener : NSObject

@property(nonatomic, assign)
    candidate_window::WebviewCandidateWindow *candidateWindow;
- (void)accentColorChanged:(NSNotification *)notification;

@end

@implementation NotificationListener

- (void)accentColorChanged:(NSNotification *)notification {
    self.candidateWindow->update_accent_color();
}

@end

namespace candidate_window {

WebviewCandidateWindow::WebviewCandidateWindow()
    : w_(1, [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 400, 300)
                                        styleMask:NSWindowStyleMaskBorderless
                                          backing:NSBackingStoreBuffered
                                            defer:NO]),
      listener_([[NotificationListener alloc] init]) {
    [static_cast<NSWindow *>(w_.window()) setLevel:NSPopUpMenuWindowLevel];
    set_transparent_background();

    auto listener = static_cast<NotificationListener *>(listener_);
    [listener setCandidateWindow:this];
    [[NSDistributedNotificationCenter defaultCenter]
        addObserver:listener
           selector:@selector(accentColorChanged:)
               name:@"AppleColorPreferencesChangedNotification"
             object:nil];

    bind("_resize", [this](double x, double y, double width, double height) {
        const int gap = 4;
        const int preedit_height = 24;
        int screen_width = [[NSScreen mainScreen] frame].size.width;

        if (x + width > screen_width) {
            x = screen_width - width;
        }
        if (x < 0) {
            x = 0;
        }
        if (height + gap > y) { // No enough space underneath
            y = std::max<double>(y + preedit_height + gap, 0);
        } else {
            y -= height + gap;
        }

        NSWindow *window = static_cast<NSWindow *>(w_.window());
        [window setFrame:NSMakeRect(x, y, width, height)
                 display:YES
                 animate:NO];
        [window orderFront:nil];
        [window setIsVisible:YES];
    });

    bind("_select", [this](size_t i) { select_callback(i); });

    std::string html_template(reinterpret_cast<char *>(HTML_TEMPLATE),
                              HTML_TEMPLATE_len);
    w_.set_html(html_template.c_str());
}

WebviewCandidateWindow::~WebviewCandidateWindow() {
    [(id) w_.window() close];
}

void WebviewCandidateWindow::set_transparent_background() {
    // Transparent NSWindow
    [static_cast<NSWindow *>(w_.window())
        setBackgroundColor:[NSColor colorWithRed:0 green:0 blue:0 alpha:0]];
    // Transparent WKWebView
    WKWebView *webView = static_cast<WKWebView *>(w_.view());
    [webView setValue:@NO forKey:@"drawsBackground"];
    [webView setUnderPageBackgroundColor:[NSColor clearColor]];
}

void WebviewCandidateWindow::update_accent_color() {
    NSNumber *accentColor = [[NSUserDefaults standardUserDefaults]
        objectForKey:@"AppleAccentColor"];
    if (accentColor == nil) {
        invoke_js("setAccentColor", nil);
    } else {
        invoke_js("setAccentColor", [accentColor intValue]);
    }
}

void WebviewCandidateWindow::set_layout(layout_t layout) {
    invoke_js("setLayout", layout);
}

void WebviewCandidateWindow::set_candidates(
    const std::vector<std::string> &candidates,
    const std::vector<std::string> &labels, int highlighted) {
    invoke_js("setCandidates", candidates, labels, highlighted);
}

void WebviewCandidateWindow::set_theme(theme_t theme) {
    invoke_js("setTheme", theme);
}

void WebviewCandidateWindow::show(double x, double y) {
    if (first_draw_) {
        first_draw_ = false;
        update_accent_color();
    }
    invoke_js("resize", x, y);
}

void WebviewCandidateWindow::hide() {
    auto window = static_cast<NSWindow *>(w_.window());
    [window orderBack:nil];
    [window setIsVisible:NO];
}

static void build_html_open_tags(std::stringstream &ss, int flags) {
    if (flags & Underline)
        ss << "<u>";
    if (flags & Highlight)
        ss << "<mark>";
    if (flags & Bold)
        ss << "<b>";
    if (flags & Strike)
        ss << "<s>";
    if (flags & Italic)
        ss << "<i>";
}

static void build_html_close_tags(std::stringstream &ss, int flags) {
    if (flags & Underline)
        ss << "</u>";
    if (flags & Highlight)
        ss << "</mark>";
    if (flags & Bold)
        ss << "</b>";
    if (flags & Strike)
        ss << "</s>";
    if (flags & Italic)
        ss << "</i>";
}

static void build_html_escape(std::stringstream &ss, const std::string &str) {
    for (char c : str) {
        switch (c) {
        case '<':
            ss << "&lt;";
            break;
        case '>':
            ss << "&gt;";
            break;
        case '&':
            ss << "&amp;";
            break;
        default:
            ss << c;
        }
    }
}

static std::string formatted_to_html(const formatted<std::string> &f) {
    std::stringstream ss;
    for (const auto &slice : f) {
        build_html_open_tags(ss, slice.second);
        build_html_escape(ss, slice.first);
        build_html_close_tags(ss, slice.second);
    }
    return ss.str();
}

void WebviewCandidateWindow::update_input_panel(
    const formatted<std::string> &preedit, int preedit_cursor,
    const formatted<std::string> &auxUp,
    const formatted<std::string> &auxDown) {
    invoke_js("updateInputPanel", formatted_to_html(preedit),
              formatted_to_html(auxUp), formatted_to_html(auxDown));
}

} // namespace candidate_window
