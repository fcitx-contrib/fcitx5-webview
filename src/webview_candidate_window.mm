#include "webview_candidate_window.hpp"
#include "html_template.hpp"
#import <WebKit/WKWebView.h>
#include <algorithm>
#include <sstream>

namespace candidate_window {

WebviewCandidateWindow::WebviewCandidateWindow()
    : w_(1, [[NSWindow alloc] initWithContentRect:NSMakeRect(0, 0, 400, 300)
                                        styleMask:NSWindowStyleMaskBorderless
                                          backing:NSBackingStoreBuffered
                                            defer:NO]) {
    [static_cast<NSWindow *>(w_.window()) setLevel:NSPopUpMenuWindowLevel];
    set_transparent_background();
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
    w_.set_html(HTML_TEMPLATE);
}

WebviewCandidateWindow::~WebviewCandidateWindow() {}

void WebviewCandidateWindow::set_transparent_background() {
    // Transparent NSWindow
    [static_cast<NSWindow *>(w_.window())
        setBackgroundColor:[NSColor colorWithRed:0 green:0 blue:0 alpha:0]];
    // Transparent WKWebView
    WKWebView *webView = static_cast<WKWebView *>(w_.view());
    [webView setValue:@NO forKey:@"drawsBackground"];
    [webView setUnderPageBackgroundColor:[NSColor clearColor]];
}

void WebviewCandidateWindow::set_layout(layout_t layout) {
    invoke_js("setLayout", layout);
}

void WebviewCandidateWindow::set_candidates(
    const std::vector<std::string> &candidates, int highlighted) {
    invoke_js("setCandidates", candidates, highlighted);
}

void WebviewCandidateWindow::show(double x, double y) {
    invoke_js("resize", x, y);
}

void WebviewCandidateWindow::hide() {
    auto window = static_cast<NSWindow *>(w_.window());
    [window orderBack:nil];
    [window setIsVisible:NO];
}

} // namespace candidate_window
