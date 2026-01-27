#include "webview_candidate_window.hpp"
#ifdef __APPLE__
#import <Cocoa/Cocoa.h>
#elif defined(__linux__)
#include <gtk/gtk.h>
#endif

#include <iostream>

std::unique_ptr<candidate_window::WebviewCandidateWindow> candidateWindow;

void doPreview() {
    candidateWindow =
        std::make_unique<candidate_window::WebviewCandidateWindow>([=]() {
            std::cout << "Window loaded" << std::endl;
            candidateWindow->set_layout(candidate_window::layout_t::horizontal);
            candidateWindow->set_paging_buttons(true, false, true);
            candidateWindow->set_candidates(
                {{"<h1>防注入</h1>", "1", "注释", {{0, "<h1>防注入</h1>"}}},
                 {"候选词", "2", "", {{1, "删词"}, {2, "置顶"}}},
                 {"制\t表\t符\n多 空  格", "2", ""}},
                0, candidate_window::scroll_state_t::none, false, false);
            candidateWindow->set_theme(candidate_window::theme_t::light);
            candidateWindow->set_native_blur(candidate_window::blur_t::system);
            candidateWindow->show(100, 200, 18);
        });
    candidateWindow->set_select_callback(
        [](int index) { std::cout << "selected " << index << std::endl; });
    candidateWindow->set_page_callback([](bool next) {
        std::cout << (next ? "next" : "prev") << " page" << std::endl;
    });
    candidateWindow->set_action_callback([](int index, int id) {
        std::cout << "action " << id << " on " << index << std::endl;
    });
}

int main(int argc, char *argv[]) {
#ifdef __APPLE__
    @autoreleasepool {
        NSApplication *application = [NSApplication sharedApplication];
        doPreview();
        [application run];
    }
#elif defined(__linux__)
    gtk_init(&argc, &argv);
    doPreview();
    gtk_main();
#endif
    return 0;
}
