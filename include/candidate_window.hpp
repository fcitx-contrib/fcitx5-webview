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

enum writing_mode_t { horizontal_tb = 0, vertical_rl = 1, vertical_lr = 2 };

enum scroll_state_t { none = 0, ready = 1, scrolling = 2 };

enum scroll_key_action_t {
    one = 1,
    two = 2,
    three = 3,
    four = 4,
    five = 5,
    six = 6,
    up = 10,
    down = 11,
    left = 12,
    right = 13,
    home = 14,
    end = 15,
    page_up = 16,
    page_down = 17,
    expand = 18,
    collapse = 19,
    commit = 20
};

struct CandidateAction {
    int id;
    std::string text;
};

struct Candidate {
    std::string text;
    std::string label;
    std::string comment;
    std::vector<CandidateAction> actions;
};

class CandidateWindow {
  public:
    virtual ~CandidateWindow() = default;
    virtual void set_layout(layout_t layout) = 0;
    virtual void update_input_panel(const formatted<std::string> &preedit,
                                    int preedit_cursor,
                                    const formatted<std::string> &auxUp,
                                    const formatted<std::string> &auxDown) = 0;
    virtual void set_candidates(const std::vector<Candidate> &candidates,
                                int highlighted, scroll_state_t scroll_state,
                                bool scroll_start, bool scroll_end) = 0;
    virtual void scroll_key_action(scroll_key_action_t action) = 0;
    virtual void
    answer_actions(const std::vector<CandidateAction> &actions) = 0;
    virtual void set_theme(theme_t theme) = 0;
    virtual void set_writing_mode(writing_mode_t mode) = 0;
    virtual void set_style(const void *style) = 0;
    virtual void show(double x, double y) = 0;
    virtual void hide() = 0;

    void set_init_callback(std::function<void()> callback) {
        init_callback = callback;
    }

    void set_select_callback(std::function<void(int index)> callback) {
        select_callback = callback;
    }

    void set_highlight_callback(std::function<void(int index)> callback) {
        highlight_callback = callback;
    }

    void set_cursor_text(const std::string &text) { cursor_text_ = text; }
    void set_highlight_mark_text(const std::string &text) {
        highlight_mark_text_ = text;
    }

    void set_page_callback(std::function<void(bool)> callback) {
        page_callback = callback;
    }

    void set_scroll_callback(std::function<void(int, int)> callback) {
        scroll_callback = callback;
    }

    void set_paging_buttons(bool pageable, bool has_prev, bool has_next) {
        pageable_ = pageable;
        has_prev_ = has_prev;
        has_next_ = has_next;
    }

    void set_ask_actions_callback(std::function<void(int index)> callback) {
        ask_actions_callback = callback;
    }

    void set_action_callback(std::function<void(int index, int id)> callback) {
        action_callback = callback;
    }

  protected:
    std::function<void()> init_callback = []() {};
    std::function<void(int index)> select_callback = [](int) {};
    std::function<void(int index)> highlight_callback = [](int) {};
    std::function<void(bool next)> page_callback = [](bool) {};
    std::function<void(int, int)> scroll_callback = [](int, int) {};
    std::function<void(int index)> ask_actions_callback = [](int) {};
    std::function<void(int index, int id)> action_callback = [](int, int) {};
    std::string cursor_text_ = "";
    std::string highlight_mark_text_ = "";
    bool pageable_ = false;
    bool has_prev_ = false;
    bool has_next_ = false;
};
} // namespace candidate_window
#endif
