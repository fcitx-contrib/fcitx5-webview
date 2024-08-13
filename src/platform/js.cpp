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

void WebviewCandidateWindow::hide() { std::cerr << "hide" << std::endl; }

void WebviewCandidateWindow::write_clipboard(const std::string &html) {}

void WebviewCandidateWindow::resize(double dx, double dy, double anchor_top,
                                    double anchor_right, double anchor_bottom,
                                    double anchor_left, double width,
                                    double height, bool dragging) {
    std::cerr << "resize" << std::endl;
}
} // namespace candidate_window
