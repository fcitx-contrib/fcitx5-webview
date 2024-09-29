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

void to_json(nlohmann::json &j, const CandidateAction &a) {
    j = nlohmann::json{{"id", a.id}, {"text", a.text}};
}

void to_json(nlohmann::json &j, const Candidate &c) {
    j = nlohmann::json{{"text", c.text},
                       {"label", c.label},
                       {"comment", c.comment},
                       {"actions", c.actions}};
}

CandidateAction escape_action(const CandidateAction &a) {
    return CandidateAction{a.id, escape_html(a.text)};
}

Candidate escape_candidate(const Candidate &c) {
    std::vector<CandidateAction> escaped_actions;
    escaped_actions.reserve(c.actions.size());
    std::transform(c.actions.begin(), c.actions.end(),
                   std::back_inserter(escaped_actions), escape_action);
    return Candidate{escape_html(c.text), escape_html(c.label),
                     escape_html(c.comment), std::move(escaped_actions)};
}

WebviewCandidateWindow::WebviewCandidateWindow()
#ifndef __EMSCRIPTEN__
    : w_(std::make_shared<webview::webview>(1, create_window()))
#endif
{
    platform_init();
    set_transparent_background();
    update_accent_color();

    bind("_resize",
         [this](double dx, double dy, double anchor_top, double anchor_right,
                double anchor_bottom, double anchor_left, double panel_top,
                double panel_right, double panel_bottom, double panel_left,
                double panel_radius, double border_width, double width,
                double height, bool dragging) {
             resize(dx, dy, anchor_top, anchor_right, anchor_bottom,
                    anchor_left, panel_top, panel_right, panel_bottom,
                    panel_left, panel_radius, border_width, width, height,
                    dragging);
         });

    bind("_select", [this](int i) { select_callback(i); });

    bind("_highlight", [this](int i) { highlight_callback(i); });

    bind("_page", [this](bool next) { page_callback(next); });

    bind("_scroll",
         [this](int start, int length) { scroll_callback(start, length); });

    bind("_askActions", [this](int i) { ask_actions_callback(i); });

    bind("_action", [this](int i, int id) { action_callback(i, id); });

    bind("_onload", [this]() { init_callback(); });

    bind("_log", [](std::string s) { std::cerr << s; });

    bind("_copyHTML", [this](std::string html) { write_clipboard(html); });

    std::string html_template(reinterpret_cast<char *>(HTML_TEMPLATE),
                              HTML_TEMPLATE_len);
#ifdef __EMSCRIPTEN__
    EM_ASM(fcitx.createPanel(UTF8ToString($0)), html_template.c_str());
#else
    w_->set_html(html_template.c_str());
#endif
}

void WebviewCandidateWindow::set_accent_color() {
    if (accent_color_nil_) {
        invoke_js("setAccentColor", nullptr);
    } else {
        invoke_js("setAccentColor", accent_color_);
    }
}

void WebviewCandidateWindow::set_layout(layout_t layout) {
    layout_ = layout;
    invoke_js("setLayout", layout);
}

void WebviewCandidateWindow::set_candidates(
    const std::vector<Candidate> &candidates, int highlighted,
    scroll_state_t scroll_state, bool scroll_start, bool scroll_end) {
    std::vector<Candidate> escaped_candidates;
    escaped_candidates.reserve(candidates.size());
    std::transform(candidates.begin(), candidates.end(),
                   std::back_inserter(escaped_candidates), escape_candidate);
    invoke_js("setCandidates", escaped_candidates, highlighted,
              escape_html(highlight_mark_text_), pageable_, has_prev_,
              has_next_, scroll_state, scroll_start, scroll_end);
}

void WebviewCandidateWindow::scroll_key_action(scroll_key_action_t action) {
    invoke_js("scrollKeyAction", action);
}

void WebviewCandidateWindow::answer_actions(
    const std::vector<CandidateAction> &actions) {
    std::vector<CandidateAction> escaped_actions;
    escaped_actions.reserve(actions.size());
    std::transform(actions.begin(), actions.end(),
                   std::back_inserter(escaped_actions), escape_action);
    invoke_js("answerActions", escaped_actions);
}

void WebviewCandidateWindow::set_theme(theme_t theme) {
    invoke_js("setTheme", theme);
}

void WebviewCandidateWindow::set_writing_mode(writing_mode_t mode) {
    writing_mode_ = mode;
    invoke_js("setWritingMode", mode);
}

void WebviewCandidateWindow::set_style(const void *style) {
    invoke_js("setStyle", static_cast<const char *>(style));
}

void WebviewCandidateWindow::show(double x, double y) {
    cursor_x_ = x;
    cursor_y_ = y;
    // It's _resize which is called by resize that actually shows the window
    if (hidden_) {
        // Ideally this could be called only on first draw since we listen on
        // accent color change, but the first draw may fail if webview is not
        // warmed-up yet, and it won't be updated until user changes color.
        set_accent_color();
    }
    invoke_js("resize", 0., 0., false);
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
                                     const std::string &cursor_text = "",
                                     int cursor = -1) {
    std::stringstream ss;
    int cursor_pos = 0;
    if (cursor >= 0) {
        ss << "<div class=\"fcitx-pre-cursor\">";
    }
    for (const auto &slice : f) {
        build_html_open_tags(ss, slice.second);
        auto size =
            (int)slice.first
                .size(); // ensure signed comparison since cursor may be -1
        if (cursor_pos <= cursor && cursor <= cursor_pos + size) {
            ss << escape_html(slice.first.substr(0, cursor - cursor_pos));
            if (cursor_text.empty()) {
                ss << "</div><div class=\"fcitx-cursor fcitx-no-text\">";
            } else {
                ss << "</div><div class=\"fcitx-cursor\">";
                ss << escape_html(cursor_text);
            }
            ss << "</div><div class=\"fcitx-post-cursor\">";
            ss << escape_html(slice.first.substr(cursor - cursor_pos));
            // Do not draw cursor again when it's at the end of current slice
            cursor = -1;
        } else {
            ss << escape_html(slice.first);
            cursor_pos += size;
        }
        if (cursor >= 0) {
            ss << "</div>";
        }
        build_html_close_tags(ss, slice.second);
    }
    return ss.str();
}

void WebviewCandidateWindow::update_input_panel(
    const formatted<std::string> &preedit, int preedit_cursor,
    const formatted<std::string> &auxUp,
    const formatted<std::string> &auxDown) {
    invoke_js("updateInputPanel",
              formatted_to_html(preedit, cursor_text_, preedit_cursor),
              formatted_to_html(auxUp), formatted_to_html(auxDown));
}

void WebviewCandidateWindow::copy_html() { invoke_js("copyHTML"); }

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
