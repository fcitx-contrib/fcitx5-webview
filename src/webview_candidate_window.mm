#include "webview_candidate_window.hpp"
#include "html_template.hpp"
#include "utility.hpp"
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

@interface HoverableWindow : NSWindow

@end

@implementation HoverableWindow

- (BOOL)isKeyWindow {
    return YES;
}

@end

namespace candidate_window {

NSRect getNearestScreenFrame(double x, double y) {
    // mainScreen is not where (0,0) is in, but screen of focused window.
    NSRect frame = [NSScreen mainScreen].frame;
    NSPoint point = NSMakePoint(x, y);
    NSArray *screens = [NSScreen screens];
    for (NSUInteger i = 0; i < screens.count; ++i) {
        NSRect rect = [screens[i] frame];
        // In Firefox Google Docs, reported coordicates may be outside any
        // screen, so distance-based selection is worse than point-in-screen
        // check as fallback is mainScreen.
        if (NSPointInRect(point, rect)) {
            frame = rect;
            break;
        }
    }
    return frame;
}

WebviewCandidateWindow::WebviewCandidateWindow()
    : w_(std::make_shared<webview::webview>(
          1, [[HoverableWindow alloc]
                 initWithContentRect:NSMakeRect(0, 0, 400, 300)
                           styleMask:NSWindowStyleMaskBorderless
                             backing:NSBackingStoreBuffered
                               defer:NO])),
      listener_([[NotificationListener alloc] init]) {
    [static_cast<NSWindow *>(w_->window()) setLevel:NSPopUpMenuWindowLevel];
    set_transparent_background();

    auto listener = static_cast<NotificationListener *>(listener_);
    [listener setCandidateWindow:this];
    [[NSDistributedNotificationCenter defaultCenter]
        addObserver:listener
           selector:@selector(accentColorChanged:)
               name:@"AppleColorPreferencesChangedNotification"
             object:nil];
    update_accent_color();

    bind("_resize", [this](double dx, double dy, double shadow_top,
                           double shadow_right, double shadow_bottom,
                           double shadow_left, double width, double height,
                           bool dragging) {
        const int gap = 4;
        const int preedit_height = 24;
        NSRect frame = getNearestScreenFrame(cursor_x_, cursor_y_);
        double left = NSMinX(frame);
        double right = NSMaxX(frame);
        double top = NSMaxY(frame);
        double bottom = NSMinY(frame);
        // Yes, there is no guarantee that cursor is within the screen.
        double adjusted_x = std::min(std::max(cursor_x_, left), right);
        double adjusted_y = std::min(std::max(cursor_y_, bottom), top);

        if (dragging) {
            x_ += dx;
            y_ += dy;
        } else {
            x_ = adjusted_x - shadow_left;
            if (x_ + (width - shadow_right) > right) {
                x_ = right - (width - shadow_right);
            }
            x_ = std::max<double>(x_, left - shadow_left);
            if ((height - shadow_top - shadow_bottom) + gap >
                    adjusted_y - bottom        // No enough space underneath
                || (!hidden_ && was_above_)) { // It was above, avoid flicker
                y_ = std::max<double>(
                    adjusted_y + preedit_height + gap - shadow_bottom, bottom);
                y_ = std::min<double>(y_, top - (height - shadow_top));
                was_above_ = true;
            } else {
                y_ = adjusted_y - gap - (height - shadow_top);
                was_above_ = false;
            }
        }
        hidden_ = false;
        NSWindow *window = static_cast<NSWindow *>(w_->window());
        [window setFrame:NSMakeRect(x_, y_, width, height)
                 display:YES
                 animate:NO];
        [window orderFront:nil];
        [window setIsVisible:YES];
    });

    bind("_select", [this](size_t i) { select_callback(i); });

    bind("_page", [this](bool next) { page_callback(next); });

    bind("_onload", [this]() { init_callback(); });

    std::string html_template(reinterpret_cast<char *>(HTML_TEMPLATE),
                              HTML_TEMPLATE_len);
    w_->set_html(html_template.c_str());
}

WebviewCandidateWindow::~WebviewCandidateWindow() {
    [(id)w_->window() close]; // By default NSWindow is released on close.
    [static_cast<NotificationListener *>(listener_) release];
}

void WebviewCandidateWindow::set_transparent_background() {
    // Transparent NSWindow
    [static_cast<NSWindow *>(w_->window())
        setBackgroundColor:[NSColor colorWithRed:0 green:0 blue:0 alpha:0]];
    // Transparent WKWebView
    WKWebView *webView = static_cast<WKWebView *>(w_->widget());
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
    const std::vector<std::string> &labels,
    const std::vector<std::string> &comments, int highlighted) {
    std::vector<std::string> escaped_candidates;
    std::vector<std::string> escaped_labels;
    std::vector<std::string> escaped_comments;
    escaped_candidates.reserve(candidates.size());
    std::transform(candidates.begin(), candidates.end(),
                   std::back_inserter(escaped_candidates), escape_html);
    escaped_labels.reserve(labels.size());
    std::transform(labels.begin(), labels.end(),
                   std::back_inserter(escaped_labels), escape_html);
    escaped_comments.reserve(comments.size());
    std::transform(comments.begin(), comments.end(),
                   std::back_inserter(escaped_comments), escape_html);
    invoke_js("setCandidates", escaped_candidates, escaped_labels,
              escaped_comments, highlighted, escape_html(highlight_mark_text_),
              pageable_, has_prev_, has_next_);
}

void WebviewCandidateWindow::set_theme(theme_t theme) {
    invoke_js("setTheme", theme);
}

void WebviewCandidateWindow::set_style(const void *style) {
    invoke_js("setStyle", static_cast<const char *>(style));
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
    auto window = static_cast<NSWindow *>(w_->window());
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

static std::string formatted_to_html(const formatted<std::string> &f,
                                     const std::string &cursor_text = "",
                                     int cursor = -1) {
    std::stringstream ss;
    int cursor_pos = 0;
    for (const auto &slice : f) {
        build_html_open_tags(ss, slice.second);
        auto size =
            (int)slice.first
                .size(); // ensure signed comparison since cursor may be -1
        if (cursor_pos <= cursor && cursor <= cursor_pos + size) {
            ss << escape_html(slice.first.substr(0, cursor - cursor_pos));
            if (cursor_text.empty()) {
                ss << "<div class=\"cursor no-text\">";
            } else {
                ss << "<div class=\"cursor\">";
                ss << escape_html(cursor_text);
            }
            ss << "</div>";
            ss << escape_html(slice.first.substr(cursor - cursor_pos));
            // Do not draw cursor again when it's at the end of current slice
            cursor = -1;
        } else {
            ss << escape_html(slice.first);
            cursor_pos += size;
        }
        build_html_close_tags(ss, slice.second);
    }
    return ss.str();
}

void WebviewCandidateWindow::update_input_panel(
    const formatted<std::string> &preedit, int preedit_cursor,
    const formatted<std::string> &auxUp,
    const formatted<std::string> &auxDown) {
    invoke_js("updateInputPanel",
              formatted_to_html(preedit, cursor_text_, preedit_cursor),
              formatted_to_html(auxUp), formatted_to_html(auxDown));
}

} // namespace candidate_window
