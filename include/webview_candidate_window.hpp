#ifndef WEBVIEW_CANDIDATE_WINDOW_H
#define WEBVIEW_CANDIDATE_WINDOW_H

#include "candidate_window.hpp"
#include "utility.hpp"
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#include "webview.h"
#endif
#include <cstdint>
#include <iostream>
#include <nlohmann/json.hpp>
#include <sstream>

namespace candidate_window {

enum CustomAPI : uint64_t { kCurl = 1 };

#ifdef __EMSCRIPTEN__
extern std::unordered_map<std::string, std::function<std::string(std::string)>>
    handlers;
#endif

class WebviewCandidateWindow : public CandidateWindow {
  public:
    WebviewCandidateWindow();
    ~WebviewCandidateWindow();
    void set_layout(layout_t layout) override;
    void update_input_panel(const formatted<std::string> &preedit,
                            int preedit_cursor,
                            const formatted<std::string> &auxUp,
                            const formatted<std::string> &auxDown) override;
    void set_candidates(const std::vector<Candidate> &candidates,
                        int highlighted, scroll_state_t scroll_state,
                        bool scroll_start, bool scroll_end) override;
    void scroll_key_action(scroll_key_action_t action) override;
    void answer_actions(const std::vector<CandidateAction> &actions) override;
    void set_theme(theme_t theme) override;
    void set_writing_mode(writing_mode_t mode) override;
    void set_style(const void *style) override;
    void set_native_blur(bool enabled) override;
    void set_native_shadow(bool enabled) override;
    void show(double x, double y) override;
    void hide() override;

    void update_accent_color();
    void set_accent_color();
    void copy_html();

#ifndef __EMSCRIPTEN__
    void set_api(uint64_t apis);
    void load_plugins(const std::vector<std::string> &names);
    void unload_plugins();
#endif

  private:
#ifndef __EMSCRIPTEN__
    std::shared_ptr<webview::webview> w_;
#endif
    double cursor_x_ = 0;
    double cursor_y_ = 0;
    double x_ = 0;
    double y_ = 0;
    bool hidden_ = true;
    bool was_above_ = false;
    bool accent_color_nil_ = false;
    // Fallback to macOS default blue on platforms with no accent color support.
    int accent_color_ = 4;
    layout_t layout_ = layout_t::horizontal;
    writing_mode_t writing_mode_ = writing_mode_t::horizontal_tb;
    uint32_t epoch = 0; // A timestamp for async results from
                        // webview

  private:
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
    inline Ret invoke_js(const char *name, Args... args) {
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
        std::weak_ptr<webview::webview> weak_w = w_;
        async_on_main([=] {
            if (auto w = weak_w.lock()) {
                w->eval(s);
            }
        });
#endif
    }

    template <typename T>
    inline void build_js_args(std::stringstream &ss, const T &arg) {
        ss << nlohmann::json(arg).dump();
    }

    template <typename T, typename... Rest>
    inline void build_js_args(std::stringstream &ss, const T &arg,
                              const Rest &...rest) {
        build_js_args(ss, arg);
        ss << ", ";
        build_js_args(ss, rest...);
    }

    inline void build_js_args(std::stringstream &ss) {}

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

#if defined(__APPLE__)

inline __attribute__((always_inline)) void
async_on_main(std::function<void()> functor) {
    dispatch_async(dispatch_get_main_queue(), ^{
      functor();
    });
}

#elif defined(__linux__)

inline int async_on_main_trampoline(void *data) {
    auto ptr = static_cast<std::function<void()> *>(data);
    (*ptr)();
    delete ptr;
    return 0;
}

inline __attribute__((always_inline)) void
async_on_main(std::function<void()> functor) {
    auto ptr = new std::function<void()>(functor);
    g_idle_add(async_on_main_trampoline, ptr);
}

#endif

} // namespace candidate_window
#endif
