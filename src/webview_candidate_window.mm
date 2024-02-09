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
    self.candidateWindow->set_accent_color();
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
    update_accent_color();

    bind("_resize", [this](double dx, double dy, double width, double height,
                           bool dragging) {
        const int gap = 4;
        const int preedit_height = 24;
        int screen_width = [[NSScreen mainScreen] frame].size.width;

        if (dragging) {
            x_ += dx;
            y_ += dy;
        } else {
            x_ = cursor_x_;
            y_ = cursor_y_;
            if (x_ + width > screen_width) {
                x_ = screen_width - width;
            }
            if (x_ < 0) {
                x_ = 0;
            }
            if (height + gap > y_              // No enough space underneath
                || (!hidden_ && was_above_)) { // It was above, avoid flicker
                y_ = std::max<double>(y_ + preedit_height + gap, 0);
                was_above_ = true;
            } else {
                y_ -= height + gap;
                was_above_ = false;
            }
        }
        hidden_ = false;
        NSWindow *window = static_cast<NSWindow *>(w_.window());
        [window setFrame:NSMakeRect(x_, y_, width, height)
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

WebviewCandidateWindow::~WebviewCandidateWindow() { [(id)w_.window() close]; }

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
        accent_color_nil_ = true;
    } else {
        accent_color_nil_ = false;
        accent_color_ = [accentColor intValue];
    }
}

void WebviewCandidateWindow::set_accent_color() {
    if (accent_color_nil_) {
        invoke_js("setAccentColor", nullptr);
    } else {
        invoke_js("setAccentColor", accent_color_);
    }
}

void WebviewCandidateWindow::set_layout(layout_t layout) {
    invoke_js("setLayout", layout);
}

void WebviewCandidateWindow::set_candidates(
    const std::vector<std::string> &candidates,
    const std::vector<std::string> &labels, int highlighted) {
    std::vector<std::string> escaped_candidates;
    std::vector<std::string> escaped_labels;
    escaped_candidates.reserve(candidates.size());
    std::transform(candidates.begin(), candidates.end(),
                   std::back_inserter(escaped_candidates), escape_html);
    escaped_labels.reserve(labels.size());
    std::transform(labels.begin(), labels.end(),
                   std::back_inserter(escaped_labels), escape_html);
    invoke_js("setCandidates", escaped_candidates, escaped_labels, highlighted);
}

void WebviewCandidateWindow::set_theme(theme_t theme) {
    invoke_js("setTheme", theme);
}

void WebviewCandidateWindow::show(double x, double y) {
    cursor_x_ = x;
    cursor_y_ = y;
    // It's _resize which is called by resize that actually shows the window
    if (hidden_) {
        // Ideally this could be called only on first draw since we listen on
        // accent color change, but the first draw may fail if webview is not
        // warmed-up yet, and it won't be updated until user changes color.
        set_accent_color();
    }
    invoke_js("resize", 0., 0., false);
}

void WebviewCandidateWindow::hide() {
    auto window = static_cast<NSWindow *>(w_.window());
    [window orderBack:nil];
    [window setIsVisible:NO];
    hidden_ = true;
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

static std::string formatted_to_html(const formatted<std::string> &f) {
    std::stringstream ss;
    for (const auto &slice : f) {
        build_html_open_tags(ss, slice.second);
        ss << escape_html(slice.first);
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
