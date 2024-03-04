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
    Highlight = (1 << 4),
    Bold = (1 << 6),
    Strike = (1 << 7),
    Italic = (1 << 8),
};

template <typename T> using formatted = std::vector<std::pair<T, int>>;

enum theme_t { system = 0, light = 1, dark = 2 };

class CandidateWindow {
  public:
    virtual ~CandidateWindow() = default;
    virtual void set_layout(layout_t layout) = 0;
    virtual void set_preedit_mode(bool enabled) = 0;
    virtual void update_input_panel(const formatted<std::string> &preedit,
                                    int preedit_cursor,
                                    const formatted<std::string> &auxUp,
                                    const formatted<std::string> &auxDown) = 0;
    virtual void set_candidates(const std::vector<std::string> &candidates,
                                const std::vector<std::string> &labels,
                                int highlighted) = 0;
    virtual void set_highlight_callback(std::function<void(size_t index)>) = 0;
    virtual void set_theme(theme_t theme) = 0;
    virtual void set_style(const void *style) = 0;
    virtual void show(double x, double y) = 0;
    virtual void hide() = 0;

    void set_init_callback(std::function<void()> callback) {
        init_callback = callback;
    }

    void set_select_callback(std::function<void(size_t index)> callback) {
        select_callback = callback;
    }

    void set_cursor_text(const std::string &text) { cursor_text_ = text; }

  protected:
    std::function<void()> init_callback = []() {};
    std::function<void(size_t index)> select_callback = [](size_t) {};
    std::string cursor_text_ = "";
};
} // namespace candidate_window
#endif
