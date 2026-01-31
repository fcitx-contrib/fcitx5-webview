set(WCW_SRC
    utility.cpp
    webview_candidate_window.cpp
    platform.cpp
)
if(NOT EMSCRIPTEN)
    list(APPEND WCW_SRC curl.cpp)
endif()

add_library(WebviewCandidateWindow STATIC ${WCW_SRC})
target_include_directories(WebviewCandidateWindow PUBLIC "${PROJECT_SOURCE_DIR}/include" "${PROJECT_SOURCE_DIR}/webview")
target_link_libraries(WebviewCandidateWindow ${LIBS})
if(APPLE)
    target_compile_options(WebviewCandidateWindow PRIVATE "-Wno-auto-var-id" "-ObjC++")
endif()

add_dependencies(WebviewCandidateWindow GenerateHTML)
