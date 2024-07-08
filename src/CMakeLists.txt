add_library(WebviewCandidateWindow
    utility.cpp
    "${PROJECT_SOURCE_DIR}/pugixml/src/pugixml.cpp"
    webview_candidate_window.cpp
    platform.cpp
)
target_include_directories(WebviewCandidateWindow PUBLIC "${PROJECT_SOURCE_DIR}/include" "${PROJECT_SOURCE_DIR}/webview")
target_link_libraries(WebviewCandidateWindow ${LIBS})
if(APPLE)
    target_compile_options(WebviewCandidateWindow PRIVATE "-Wno-auto-var-id" "-ObjC++")
endif()

add_dependencies(WebviewCandidateWindow GenerateHTML)
