#include "webview_candidate_window.hpp"

namespace candidate_window {
std::unordered_map<std::string, std::function<std::string(std::string)>>
    handlers;

extern "C" {
EMSCRIPTEN_KEEPALIVE void web_action(const char *action, const char *args) {
    handlers[action](args);
}
}

void WebviewCandidateWindow::platform_init() {}

WebviewCandidateWindow::~WebviewCandidateWindow() {}

void WebviewCandidateWindow::set_transparent_background() {}

void WebviewCandidateWindow::update_accent_color() {}

void WebviewCandidateWindow::hide() {
    EM_ASM(fcitx.hidePanel());
    epoch += 1;
}

void WebviewCandidateWindow::write_clipboard(const std::string &html) {}

void WebviewCandidateWindow::resize(double dx, double dy, double anchor_top,
                                    double anchor_right, double anchor_bottom,
                                    double anchor_left, double panel_top,
                                    double panel_right, double panel_bottom,
                                    double panel_left, double panel_radius,
                                    double border_width, double width,
                                    double height, bool dragging) {
    EM_ASM(fcitx.placePanel($0, $1, $2, $3, $4), dx, dy, anchor_top,
           anchor_left, dragging);
}

void WebviewCandidateWindow::set_native_blur(bool enabled) {
    // Not supported.
}

void WebviewCandidateWindow::set_native_shadow(bool enabled) {
    // Not supported.
}
} // namespace candidate_window
