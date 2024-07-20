#include "webview_candidate_window.hpp"
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
    : w_(std::make_shared<webview::webview>(1, create_window())) {
    platform_init();
    set_transparent_background();
    update_accent_color();

    bind("_resize",
         [this](double dx, double dy, double anchor_top, double anchor_right,
                double anchor_bottom, double anchor_left, double width,
                double height, bool dragging) {
             resize(dx, dy, anchor_top, anchor_right, anchor_bottom,
                    anchor_left, width, height, dragging);
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
    w_->set_html(html_template.c_str());
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

} // namespace candidate_window
