add_library(WebviewCandidateWindow
    webview_candidate_window.mm
    utility.cpp
    "${PROJECT_SOURCE_DIR}/pugixml/src/pugixml.cpp"
)

target_include_directories(WebviewCandidateWindow PRIVATE "${PROJECT_SOURCE_DIR}/include")
target_link_libraries(WebviewCandidateWindow "-framework WebKit" PkgConfig::NlohmannJson)
target_compile_options(WebviewCandidateWindow PRIVATE "-Wno-auto-var-id")

add_dependencies(WebviewCandidateWindow GenerateHTML)
