#include "webview_candidate_window.hpp"
#include "html_template.hpp"
#import <WebKit/WKWebView.h>
#include <json-c/json.h>
#include <sstream>

namespace candidate_window {

WebviewCandidateWindow::WebviewCandidateWindow() {
    NSRect frame = NSMakeRect(0, 0, 400, 300);
    NSWindow *window =
        [[NSWindow alloc] initWithContentRect:frame
                                    styleMask:NSWindowStyleMaskBorderless
                                      backing:NSBackingStoreBuffered
                                        defer:NO];
    w_ = webview::webview(1, window);
    set_transparent_background();
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
    std::stringstream ss;
    ss << "setLayout(" << layout << ")";
    w_.eval(ss.str());
}

void WebviewCandidateWindow::set_candidates(
    const std::vector<std::string> &candidates) {
    json_object *array = json_object_new_array();
    for (const auto &candidate : candidates) {
        json_object_array_add(array, json_object_new_string(candidate.c_str()));
    }
    std::string json = json_object_to_json_string(array);
    w_.eval("setCandidates('" + json + "')");
    json_object_put(array);
}

void WebviewCandidateWindow::show() {
    [static_cast<NSWindow *>(w_.window()) makeKeyAndOrderFront:nil];
}
void WebviewCandidateWindow::hide() {
    [static_cast<NSWindow *>(w_.window()) orderBack:nil];
}

} // namespace candidate_window
