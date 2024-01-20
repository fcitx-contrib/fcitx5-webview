#ifndef WEBVIEW_CANDIDATE_WINDOW_H
#define WEBVIEW_CANDIDATE_WINDOW_H

#include "candidate_window.hpp"
#include "webview.h"

namespace candidate_window {
class WebviewCandidateWindow : public CandidateWindow {
  public:
    WebviewCandidateWindow();
    ~WebviewCandidateWindow();
    void set_layout(layout_t layout) override;
    void set_preedit_mode(bool enabled) override {}
    void set_preedit(const std::vector<std::string> &text,
                     const std::vector<format_t> format) override {}
    void set_labels(const std::vector<std::string> &labels) override {}
    void set_candidates(const std::vector<std::string> &candidates) override;
    void set_highlight_callback(std::function<void(size_t index)>) override {}
    void set_select_callback(std::function<void(size_t index)>) override {}
    void set_style(const void *style) override{};
    void show(float x, float y) override;
    void hide() override;

  private:
    void set_transparent_background();
    webview::webview w_;
};
} // namespace candidate_window
#endif
