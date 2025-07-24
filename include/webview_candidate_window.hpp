#pragma once

#include "utility.hpp"
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#include "webview.h"
#include <thread>
#endif
#include <cassert>
#include <cstdint>
#include <functional>
#include <iostream>
#include <nlohmann/json.hpp>
#include <sstream>
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
    zero = 0,
    one = 1,
    two = 2,
    three = 3,
    four = 4,
    five = 5,
    six = 6,
    seven = 7,
    eight = 8,
    nine = 9,
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

void to_json(nlohmann::json &j, const CandidateAction &a);
void to_json(nlohmann::json &j, const Candidate &c);

enum CustomAPI : uint64_t { kCurl = 1 };

#ifdef __EMSCRIPTEN__
extern std::unordered_map<std::string, std::function<std::string(std::string)>>
    handlers;
#endif

// User of this class should ensure no concurrent calls from different threads.
class WebviewCandidateWindow {
  public:
    // Below are required to be called from main thread.
    WebviewCandidateWindow();
    ~WebviewCandidateWindow();
    void scroll_key_action(scroll_key_action_t action) const;
    void answer_actions(const std::vector<CandidateAction> &actions) const;
    void set_theme(theme_t theme) const;
    void set_style(const void *style) const;
    void set_native_blur(bool enabled) const;
    void set_native_shadow(bool enabled) const;
    // If typing fast after Cmd+Space, the key event may be processed before an
    // async call to hide, making it between set_candidates and show. Use const
    // so hide doesn't modify panel state for show.
    void show(double x, double y, double height) const;
    void hide() const;

    // color is either #RRGGBBAA or "" meaning app has no accent color.
    void apply_app_accent_color(const std::string &color);
    void set_accent_color() const;
    void copy_html() const;

#ifndef __EMSCRIPTEN__
    void set_api(uint64_t apis);
    void load_plugins(const std::vector<std::string> &names);
    void unload_plugins();
#endif

    // Below are allowed to be called from any thread.
    void update_input_panel(const formatted<std::string> &preedit, int caret,
                            const formatted<std::string> &auxUp,
                            const formatted<std::string> &auxDown);
    void set_candidates(const std::vector<Candidate> &candidates,
                        int highlighted, scroll_state_t scroll_state,
                        bool scroll_start, bool scroll_end);
    void set_layout(layout_t layout) { layout_ = layout; }
    void set_writing_mode(writing_mode_t mode) { writing_mode_ = mode; }

    void set_init_callback(std::function<void()> callback) {
        init_callback = callback;
    }

    void set_select_callback(std::function<void(int index)> callback) {
        select_callback = callback;
    }

    void set_highlight_callback(std::function<void(int index)> callback) {
        highlight_callback = callback;
    }

    void set_caret_text(const std::string &text) { caret_text_ = text; }
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

    // Fetch system accent color.
    void update_accent_color();

  private:
#ifndef __EMSCRIPTEN__
    std::thread::id main_thread_id_;
    std::shared_ptr<webview::webview> w_;
#endif
    mutable double caret_x_ = 0;
    mutable double caret_y_ = 0;
    mutable double caret_height_ = 0;
    double x_ = 0;
    double y_ = 0;
    mutable bool hidden_ = true;
    bool was_above_ = false;
    bool accent_color_nil_ = false;
    // Fallback to macOS default blue on platforms with no accent color support.
    int accent_color_ = 4;
    std::string app_accent_color_ = "";
    layout_t layout_ = layout_t::horizontal;
    writing_mode_t writing_mode_ = writing_mode_t::horizontal_tb;
    std::string preedit_;
    std::string auxUp_;
    std::string auxDown_;
    std::vector<Candidate> candidates_;
    int highlighted_ = -1;
    scroll_state_t scroll_state_;
    bool scroll_start_;
    bool scroll_end_;
    mutable uint32_t epoch = 0; // A timestamp for async results from
                                // webview

  private:
    std::function<void()> init_callback = []() {};
    std::function<void(int index)> select_callback = [](int) {};
    std::function<void(int index)> highlight_callback = [](int) {};
    std::function<void(bool next)> page_callback = [](bool) {};
    std::function<void(int, int)> scroll_callback = [](int, int) {};
    std::function<void(int index)> ask_actions_callback = [](int) {};
    std::function<void(int index, int id)> action_callback = [](int, int) {};
    std::string caret_text_ = "";
    std::string highlight_mark_text_ = "";
    bool pageable_ = false;
    bool has_prev_ = false;
    bool has_next_ = false;

    /* Platform-specific interfaces (implemented in 'platform') */
    void *create_window();
    void set_transparent_background();
    void resize(double dx, double dy, double anchor_top, double anchor_right,
                double anchor_bottom, double anchor_left, double panel_top,
                double panel_right, double panel_bottom, double panel_left,
                double panel_radius, double border_width, double width,
                double height, bool dragging);
    void write_clipboard(const std::string &html);

    void *platform_data = nullptr;
    void platform_init();

  private:
    /* API */
    void api_curl(std::string id, std::string req);

  private:
    /* Invoke a JavaScript function. */
    template <typename Ret = void, bool debug = false, typename... Args>
    inline Ret invoke_js(const char *name, Args... args) const {
        std::stringstream ss;
        ss << "fcitx." << name << "(";
        build_js_args(ss, args...);
        ss << ");";
        if constexpr (debug) {
            std::cerr << ss.str() << "\n";
        }
        auto s = ss.str();
#ifdef __EMSCRIPTEN__
        emscripten_run_script(s.c_str());
#else
        assert(std::this_thread::get_id() == main_thread_id_ &&
               "invoke_js must be called from main thread");
        w_->eval(s);
#endif
    }

    template <typename T>
    inline void build_js_args(std::stringstream &ss, const T &arg) const {
        ss << nlohmann::json(arg).dump();
    }

    template <typename T, typename... Rest>
    inline void build_js_args(std::stringstream &ss, const T &arg,
                              const Rest &...rest) const {
        build_js_args(ss, arg);
        ss << ", ";
        build_js_args(ss, rest...);
    }

    inline void build_js_args(std::stringstream &ss) const {}

  private:
    /* Generic bind */
    template <typename F> inline void bind(const std::string &name, F f) {
        using Ret = typename function_traits<F>::return_type;
        using ArgsTp = typename function_traits<F>::args_tuple;
        auto handler = [=, this](std::string args_json) -> std::string {
            auto j = nlohmann::json::parse(args_json);
            ArgsTp args;
            if (std::tuple_size<ArgsTp>() > j.size()) {
                std::cerr << "[JS] Insufficient number of arguments of '"
                          << name << "', needed " << std::tuple_size<ArgsTp>()
                          << ", got " << j.size() << std::endl;
                return "";
            }
            try {
                args = json_to_tuple<ArgsTp>(
                    j, std::make_index_sequence<std::tuple_size_v<ArgsTp>>{});
            } catch (const std::exception &e) {
                // No access to fcitx logging; print to stderr.
                std::cerr << "[JS] Error running '" << name << "': " << e.what()
                          << std::endl;
                return "";
            }
            if constexpr (std::is_void_v<Ret>) {
                std::apply(f, args);
                return "";
            } else {
                auto ret = std::apply(f, args);
                return nlohmann::json(ret).dump();
            }
        };
#ifdef __EMSCRIPTEN__
        handlers[name] = handler;
#else
        w_->bind(name, handler);
#endif
    }

    template <typename Tuple, size_t... Is>
    Tuple json_to_tuple(const nlohmann::json &j, std::index_sequence<Is...>) {
        return {j[Is].get<typename std::tuple_element<Is, Tuple>::type>()...};
    }
};

} // namespace candidate_window
