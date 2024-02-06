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
    void set_candidates(const std::vector<std::string> &candidates,
                        const std::vector<std::string> &labels,
                        int highlighted) override;
    void set_highlight_callback(std::function<void(size_t index)>) override {}
    void set_theme(theme_t theme) override;
    void set_style(const void *style) override{};
    void show(double x, double y) override;
    void hide() override;

    void update_accent_color();

  private:
    void set_transparent_background();
    webview::webview w_;
    void *listener_;
    bool first_draw_ = true;
    int accent_color_ = 0;

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
        w_.eval(ss.str());
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
        w_.bind(name, [=](std::string args_json) -> std::string {
            auto j = nlohmann::json::parse(args_json);
            auto args = json_to_tuple<ArgsTp>(
                j, std::make_index_sequence<std::tuple_size_v<ArgsTp>>{});
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
