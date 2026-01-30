#include "webview_candidate_window.hpp"
#ifndef __EMSCRIPTEN__
#include "curl.hpp"
#endif
#include "html_template.hpp"
#include "utility.hpp"
#include <algorithm>
#include <iostream>
#include <sstream>

namespace candidate_window {
std::unordered_map<std::string,
                   std::function<std::string(const nlohmann::json &)>>
    handlers;

std::string call_handler(std::string s) {
    auto args = nlohmann::json::parse(s);
    if (!args.is_array() || args.empty()) {
        std::cerr << "[JS] Invalid call to fcitx: " << s << "\n";
        return "";
    }
    std::string name = args[0].get<std::string>();
    auto iter = handlers.find(name);
    if (iter == handlers.end()) {
        std::cerr << "[JS] Unknown handler name '" << name << "'\n";
        return "";
    }
    args.erase(args.begin());
    return iter->second(args);
}

void to_json(nlohmann::json &j, const CandidateAction &a) {
    j = nlohmann::json{{"id", a.id}, {"text", a.text}};
}

void to_json(nlohmann::json &j, const Candidate &c) {
    j = nlohmann::json{{"text", c.text},
                       {"label", c.label},
                       {"comment", c.comment},
                       {"actions", c.actions}};
}

WebviewCandidateWindow::WebviewCandidateWindow(
    std::function<void()> init_callback)
#ifndef __EMSCRIPTEN__
    : main_thread_id_(std::this_thread::get_id()),
      w_(std::make_unique<webview::webview>(1, create_window()))
#endif
{
    platform_init();
    set_transparent_background();
    update_accent_color();

    bind("resize",
         [this](uint32_t result_epoch, double dx, double dy, double anchor_top,
                double anchor_right, double anchor_bottom, double anchor_left,
                double panel_top, double panel_right, double panel_bottom,
                double panel_left, double top_left_radius,
                double top_right_radius, double bottom_right_radius,
                double bottom_left_radius, double border_width, double width,
                double height, bool dragging) {
             // Drop results from previous epochs. This can happen
             // because JS code runs in another thread and can be slow
             // sometimes.
             // NOTE: accept result_epoch=0 because of wrapping.
             if (result_epoch != 0 && result_epoch < epoch)
                 return;
             resize(dx, dy, anchor_top, anchor_right, anchor_bottom,
                    anchor_left, panel_top, panel_right, panel_bottom,
                    panel_left, top_left_radius, top_right_radius,
                    bottom_right_radius, bottom_left_radius, border_width,
                    width, height, dragging);
         });

    bind("select", [this](int i) { select_callback(i); });

    bind("highlight", [this](int i) { highlight_callback(i); });

    bind("page", [this](bool next) { page_callback(next); });

    bind("scroll",
         [this](int start, int length) { scroll_callback(start, length); });

    bind("askActions", [this](int i) { ask_actions_callback(i); });

    bind("action", [this](int i, int id) { action_callback(i, id); });

    bind("onload", [this, init_callback = std::move(init_callback)]() {
        invoke_js("setHost", system_, version_);
        init_callback();
    });

    bind("log", [](std::string s) { std::cerr << s; });

    bind("copyHTML", [this](std::string html) { write_clipboard(html); });

    std::string html_template(reinterpret_cast<char *>(HTML_TEMPLATE),
                              HTML_TEMPLATE_len);
#ifdef __EMSCRIPTEN__
    EM_ASM(fcitx.createPanel(UTF8ToString($0)), html_template.c_str());
#else
    w_->bind("fcitx", call_handler);
    w_->set_html(html_template.c_str());
#endif
}

void WebviewCandidateWindow::apply_app_accent_color(
    const std::string &accent_color) {
    app_accent_color_ = accent_color;
    // Set immediately (usually on focus in) to avoid flicker.
    set_accent_color();
}

void WebviewCandidateWindow::set_accent_color() const {
    if (accent_color_nil_) { // multi-color
        if (app_accent_color_.empty()) {
            invoke_js("setAccentColor", nullptr);
        } else {
            invoke_js("setAccentColor", app_accent_color_);
        }
    } else {
        invoke_js("setAccentColor", accent_color_);
    }
}

void WebviewCandidateWindow::set_candidates(std::vector<Candidate> candidates,
                                            int highlighted,
                                            scroll_state_t scroll_state,
                                            bool scroll_start,
                                            bool scroll_end) {
    candidates_ = std::move(candidates);
    highlighted_ = highlighted;
    scroll_state_ = scroll_state;
    scroll_start_ = scroll_start;
    scroll_end_ = scroll_end;
}

void WebviewCandidateWindow::scroll_key_action(
    scroll_key_action_t action) const {
    invoke_js("scrollKeyAction", action);
}

void WebviewCandidateWindow::answer_actions(
    const std::vector<CandidateAction> &actions) const {
    invoke_js("answerActions", actions);
}

void WebviewCandidateWindow::set_theme(theme_t theme) const {
    invoke_js("setTheme", theme);
}

void WebviewCandidateWindow::set_style(const void *style) const {
    invoke_js("setStyle", static_cast<const char *>(style));
}

void WebviewCandidateWindow::show(double x, double y, double height) const {
    caret_x_ = x;
    caret_y_ = y;
    caret_height_ = height;
    // It's _resize which is called by resize that actually shows the window
    if (hidden_) {
        // Ideally this could be called only on first draw since we listen on
        // accent color change, but the first draw may fail if webview is not
        // warmed-up yet, and it won't be updated until user changes color.
        set_accent_color();
    }
    epoch += 1;
    invoke_js("setLayout", layout_);
    invoke_js("setWritingMode", writing_mode_);
    invoke_js("updateInputPanel", preedit_, auxUp_, auxDown_);
    invoke_js("setCandidates", candidates_, highlighted_, highlight_mark_text_,
              pageable_, has_prev_, has_next_, scroll_state_, scroll_start_,
              scroll_end_);
    invoke_js("resize", epoch, 0., 0., false);
}

static void build_html_open_tags(std::stringstream &ss, int flags) {
    if (flags & Underline)
        ss << "<u>";
    if (flags & Highlight)
        ss << "<mark>";
    if (flags & Bold)
        ss << "<b>";
    if (flags & Strike)
        ss << "<s>";
    if (flags & Italic)
        ss << "<i>";
}

static void build_html_close_tags(std::stringstream &ss, int flags) {
    if (flags & Underline)
        ss << "</u>";
    if (flags & Highlight)
        ss << "</mark>";
    if (flags & Bold)
        ss << "</b>";
    if (flags & Strike)
        ss << "</s>";
    if (flags & Italic)
        ss << "</i>";
}

static std::string formatted_to_html(const formatted<std::string> &f,
                                     const std::string &caret_text = "",
                                     int caret = -1) {
    std::stringstream ss;
    int caret_pos = 0;
    if (caret >= 0) {
        ss << "<div class=\"fcitx-pre-caret\">";
    }
    for (const auto &slice : f) {
        build_html_open_tags(ss, slice.second);
        auto size =
            (int)slice.first
                .size(); // ensure signed comparison since caret may be -1
        if (caret_pos <= caret && caret <= caret_pos + size) {
            ss << escape_html(slice.first.substr(0, caret - caret_pos));
            if (caret_text.empty()) {
                ss << "</div><div class=\"fcitx-caret fcitx-no-text\">";
            } else {
                ss << "</div><div class=\"fcitx-caret\">";
                ss << escape_html(caret_text);
            }
            ss << "</div><div class=\"fcitx-post-caret\">";
            ss << escape_html(slice.first.substr(caret - caret_pos));
            // Do not draw caret again when it's at the end of current slice
            caret = -1;
        } else {
            ss << escape_html(slice.first);
            caret_pos += size;
        }
        if (caret >= 0) {
            ss << "</div>";
        }
        build_html_close_tags(ss, slice.second);
    }
    return ss.str();
}

void WebviewCandidateWindow::update_input_panel(
    const formatted<std::string> &preedit, int caret,
    const formatted<std::string> &auxUp,
    const formatted<std::string> &auxDown) {
    preedit_ = formatted_to_html(preedit, caret_text_, caret);
    auxUp_ = formatted_to_html(auxUp);
    auxDown_ = formatted_to_html(auxDown);
}

void WebviewCandidateWindow::copy_html() const { invoke_js("copyHTML"); }

#ifndef __EMSCRIPTEN__
void WebviewCandidateWindow::set_api(uint64_t apis) {
    if (apis & kCurl) {
        w_->bind(
            "curl",
            [this](std::string id, std::string req, void *) {
                api_curl(id, req);
            },
            nullptr);
    } else {
        w_->unbind("curl");
    }
}

void WebviewCandidateWindow::load_plugins(
    const std::vector<std::string> &names) {
    invoke_js("loadPlugins", names);
}

void WebviewCandidateWindow::unload_plugins() { invoke_js("unloadPlugins"); }

enum PromiseResolution {
    kFulfilled,
    kRejected,
};

void WebviewCandidateWindow::api_curl(std::string id, std::string req) {
    auto j = nlohmann::json::parse(req);
    std::string url;
    try {
        url = j[0].get<std::string>();
    } catch (const std::exception &e) {
        std::cerr << "[JS] Insufficient number of arguments to 'curl', "
                     "needed 1 or 2, got 0\n";
        w_->resolve(id, kRejected, "\"Bad call to 'curl'\"");
        return;
    }
    auto args = j[1];

    CURL *curl = curl_easy_init();
    if (!curl) {
        w_->resolve(id, kRejected, "\"Failed to initialize curl\"");
        return;
    }

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());

    bool binary = false;
    std::unordered_map<std::string, std::string> headers;
    struct curl_slist *hlist = NULL;

    // method
    std::string method = "GET";
    if (args.contains("method") && args["method"].is_string()) {
        method = args["method"];
        if (method == "GET") {
            curl_easy_setopt(curl, CURLOPT_HTTPGET, 1);
        } else if (method == "POST") {
            curl_easy_setopt(curl, CURLOPT_POST, 1);
        } else if (method == "DELETE" || method == "PUT" || method == "PATCH") {
            curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, method.c_str());
        } else if (method == "HEAD") {
            curl_easy_setopt(curl, CURLOPT_NOBODY, 1);
        } else if (method == "OPTIONS") {
            curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, method.c_str());
            curl_easy_setopt(curl, CURLOPT_NOBODY, 1);
        } else {
            w_->resolve(id, kRejected, nlohmann::json("Unknown HTTP method"));
            curl_easy_cleanup(curl);
            return;
        }
    }

    // json, data
    if (args.contains("json")) {
        curl_easy_setopt(curl, CURLOPT_COPYPOSTFIELDS,
                         args["json"].dump().c_str());
        headers["Content-Type"] = "application/json";
    } else if (args.contains("data") && args["data"].is_string()) {
        curl_easy_setopt(curl, CURLOPT_COPYPOSTFIELDS,
                         args["data"].get<std::string>().c_str());
    }
    if (args.contains("binary") && args["binary"].is_boolean()) {
        binary = args["binary"];
    }

    // headers
    if (args.contains("headers") && args["headers"].is_object()) {
        for (const auto &el : args["headers"].items()) {
            try {
                headers[el.key()] = el.value();
            } catch (...) {
                std::cerr << "[JS] Cannot get the value of header '" << el.key()
                          << "', value is " << el.value() << "\n";
            }
        }
    }
    for (const auto &[key, value] : headers) {
        std::string s = key + ": " + value;
        hlist = curl_slist_append(hlist, s.c_str());
    }
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, hlist);

    // timeout
    if (args.contains("timeout") && args["timeout"].is_number_integer()) {
        uint64_t timeout = args["timeout"];
        curl_easy_setopt(curl, CURLOPT_TIMEOUT_MS, timeout);
    }

    CurlMultiManager::shared().add(curl, [this, id, url, method,
                                          binary](CURLcode res, CURL *curl,
                                                  const std::string &data) {
        try {
            if (res == CURLE_OK) {
                long status = 0;
                curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &status);
                nlohmann::json j{
                    {"status", status},
                    {"data", !binary ? data : base64(data)},
                };
                std::cerr << method << " " << url << " " << status << std::endl;
                w_->resolve(id, kFulfilled, j.dump());
            } else {
                std::string errmsg = "CURL error: ";
                errmsg += curl_easy_strerror(res);
                w_->resolve(id, kRejected,
                            nlohmann::json(errmsg).dump().c_str());
            }
        } catch (const std::exception &e) {
            std::cerr << "[JS] curl callback throws " << e.what() << "\n";
            w_->resolve(id, kRejected, nlohmann::json(e.what()).dump());
        } catch (...) {
            std::cerr << "[JS] FATAL! Unhandled exception in curl callback\n";
            std::terminate();
        }
    });
}
#endif

} // namespace candidate_window
