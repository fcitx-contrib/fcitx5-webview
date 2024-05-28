#include "webview_candidate_window.hpp"
#import <Cocoa/Cocoa.h>

#include <chrono>
#include <iostream>
#include <thread>

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        NSApplication *application = [NSApplication sharedApplication];

        std::unique_ptr<candidate_window::CandidateWindow> candidateWindow =
            std::make_unique<candidate_window::WebviewCandidateWindow>();
        candidateWindow->set_select_callback([](size_t index) {
            std::cout << "selected " << index << std::endl;
        });
        candidateWindow->set_init_callback(
            []() { std::cout << "Window loaded" << std::endl; });
        candidateWindow->set_page_callback([](bool next) {
            std::cout << (next ? "next" : "prev") << " page" << std::endl;
        });
        candidateWindow->set_action_callback([](size_t index, int id) {
            std::cout << "action " << id << " on " << index << std::endl;
        });
        auto t = std::thread([&] {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            candidateWindow->set_layout(candidate_window::layout_t::vertical);
            candidateWindow->set_paging_buttons(true, false, true);
            candidateWindow->set_candidates(
                {{"<h1>防注入</h1>", "1", "注释"},
                 {"候选词", "2", "", {{1, "删词"}, {2, "置顶"}}}},
                0);
            candidateWindow->set_theme(candidate_window::theme_t::light);
            candidateWindow->show(100, 200);
        });
        [application run];
    }
    return 0;
}
