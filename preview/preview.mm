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
        auto t = std::thread([&] {
            std::this_thread::sleep_for(std::chrono::seconds(1));
            candidateWindow->set_layout(candidate_window::layout_t::vertical);
            candidateWindow->set_candidates({"虚假的", "候选词"}, 0);
            candidateWindow->show(100, 200);
        });
        [application run];
    }
    return 0;
}
