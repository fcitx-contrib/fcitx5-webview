#ifndef WEBVIEW_CANDIDATE_WINDOW_H
#define WEBVIEW_CANDIDATE_WINDOW_H

#include "candidate_window.hpp"
#include "utility.hpp"
#include "webview.h"
#include <iostream>
#include <nlohmann/json.hpp>
#include <sstream>

namespace candidate_window {
class WebviewCandidateWindow : public CandidateWindow {
  public:
    WebviewCandidateWindow();
    ~WebviewCandidateWindow();
    void set_layout(layout_t layout) override;
    void set_preedit_mode(bool enabled) override {}
    void update_input_panel(const formatted<std::string> &preedit,
                            int preedit_cursor,
                            const formatted<std::string> &auxUp,
                            const formatted<std::string> &auxDown) override;
    void set_candidates(const std::vector<Candidate> &candidates,
                        int highlighted, scroll_state_t scroll_state,
                        bool scroll_start, bool scroll_end) override;
    void scroll_key_action(scroll_key_action_t action) override;
    void set_highlight_callback(std::function<void(size_t index)>) override {}
    void set_theme(theme_t theme) override;
    void set_writing_mode(writing_mode_t mode) override;
    void set_style(const void *style) override;
    void show(double x, double y) override;
    void hide() override;

    void update_accent_color();
    void set_accent_color();
    void copy_html();

  private:
    void set_transparent_background();
    std::shared_ptr<webview::webview> w_;
    void *listener_;
    double cursor_x_ = 0;
    double cursor_y_ = 0;
    double x_ = 0;
    double y_ = 0;
    bool hidden_ = true;
    bool was_above_ = false;
    bool accent_color_nil_ = false;
    int accent_color_ = 0;
    layout_t layout_ = layout_t::horizontal;
    writing_mode_t writing_mode_ = writing_mode_t::horizontal_tb;

  private:
    /* Invoke a JavaScript function. */
    template <typename Ret = void, bool debug = false, typename... Args>
    inline Ret invoke_js(const char *name, Args... args) {
        std::stringstream ss;
        ss << name << "(";
        build_js_args(ss, args...);
        ss << ");";
        if constexpr (debug) {
            std::cerr << ss.str() << "\n";
        }
        auto s = ss.str();
        std::weak_ptr<webview::webview> weak_w = w_;
        dispatch_async(dispatch_get_main_queue(), ^{
          if (auto w = weak_w.lock()) {
              w->eval(s);
          }
        });
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
        w_->bind(name, [=](std::string args_json) -> std::string {
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
        });
    }

    template <typename Tuple, size_t... Is>
    Tuple json_to_tuple(const nlohmann::json &j, std::index_sequence<Is...>) {
        return {j[Is].get<typename std::tuple_element<Is, Tuple>::type>()...};
    }
};
} // namespace candidate_window
#endif
