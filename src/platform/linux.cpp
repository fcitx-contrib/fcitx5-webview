#include "webview_candidate_window.hpp"
#include <gtk/gtk.h>

namespace candidate_window {

void WebviewCandidateWindow::platform_init() {}

void *WebviewCandidateWindow::create_window() {
    gtk_init(nullptr, nullptr);
    auto window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_default_size(GTK_WINDOW(window), 400, 300);
    gtk_window_set_decorated(GTK_WINDOW(window), FALSE);
    return window;
}

WebviewCandidateWindow::~WebviewCandidateWindow() {
    gtk_widget_destroy(static_cast<GtkWidget *>(w_->window()));
}

void WebviewCandidateWindow::set_transparent_background() {
    auto window = static_cast<GtkWidget *>(w_->window());

    GdkScreen *screen = gtk_window_get_screen(GTK_WINDOW(window));
    GdkVisual *rgba_visual = gdk_screen_get_rgba_visual(screen);

    if (!rgba_visual) {
        std::cerr << "Your screen doesn't support transparent background.";
        return;
    }

    gtk_widget_set_visual(GTK_WIDGET(window), rgba_visual);
    gtk_widget_set_app_paintable(GTK_WIDGET(window), TRUE);
    GdkRGBA rgba{};
    webkit_web_view_set_background_color(
        static_cast<WebKitWebView *>(w_->widget()), &rgba);
}

void WebviewCandidateWindow::update_accent_color() {}

void WebviewCandidateWindow::hide() {}

void WebviewCandidateWindow::write_clipboard(const std::string &html) {}

void WebviewCandidateWindow::resize(unsigned long long call_id, double dx,
                                    double dy, double anchor_top,
                                    double anchor_right, double anchor_bottom,
                                    double anchor_left, double panel_top,
                                    double panel_right, double panel_bottom,
                                    double panel_left, double panel_radius,
                                    double width, double height,
                                    bool dragging) {
    gtk_widget_show_all(static_cast<GtkWidget *>(w_->window()));
}

void WebviewCandidateWindow::set_native_blur(bool enabled) {}

void WebviewCandidateWindow::set_native_shadow(bool enabled) {}
} // namespace candidate_window
