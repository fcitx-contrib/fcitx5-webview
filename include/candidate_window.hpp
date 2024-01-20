#ifndef CANDIDATE_WINDOW_H
#define CANDIDATE_WINDOW_H

#include <functional>
#include <string>
#include <vector>

namespace candidate_window {
enum layout_t {
    horizontal,
    vertical,
};

enum format_t {
    Underline = (1 << 3),
    HighLight = (1 << 4),
    Bold = (1 << 6),
    Strike = (1 << 7),
    Italic = (1 << 8),
};

class CandidateWindow {
  public:
    virtual ~CandidateWindow() = default;
    virtual void set_layout(layout_t layout) = 0;
    virtual void set_preedit_mode(bool enabled) = 0;
    virtual void set_preedit(const std::vector<std::string> &text,
                             const std::vector<format_t> format) = 0;
    virtual void set_labels(const std::vector<std::string> &labels) = 0;
    virtual void set_candidates(const std::vector<std::string> &candidates) = 0;
    virtual void set_highlight_callback(std::function<void(size_t index)>) = 0;
    virtual void set_select_callback(std::function<void(size_t index)>) = 0;
    virtual void set_style(const void *style) = 0;
    virtual void show(float x, float y) = 0;
    virtual void hide() = 0;
};
} // namespace candidate_window
#endif
