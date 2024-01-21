add_library(WebviewCandidateWindow webview_candidate_window.mm)

target_include_directories(WebviewCandidateWindow PRIVATE "${PROJECT_SOURCE_DIR}/include")
target_link_libraries(WebviewCandidateWindow "-framework WebKit" PkgConfig::JsonC)
target_compile_options(WebviewCandidateWindow PUBLIC "-Wno-auto-var-id")

add_dependencies(WebviewCandidateWindow patch_webview)
