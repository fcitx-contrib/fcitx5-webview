#include "webview_candidate_window.hpp"

namespace candidate_window {
void WebviewCandidateWindow::platform_init() {}

WebviewCandidateWindow::~WebviewCandidateWindow() {}

void WebviewCandidateWindow::set_transparent_background() {}

void WebviewCandidateWindow::update_accent_color() {}

void WebviewCandidateWindow::hide() {
    std::cerr << "hide" << std::endl;
}
}
