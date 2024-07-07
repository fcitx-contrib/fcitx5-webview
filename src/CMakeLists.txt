set(SOURCES
    utility.cpp
    "${PROJECT_SOURCE_DIR}/pugixml/src/pugixml.cpp"
)

if(APPLE)
    list(APPEND SOURCES webview_candidate_window.mm macos.mm)
elseif(LINUX)
    list(APPEND SOURCES webview_candidate_window.cpp linux.cpp)
endif()

add_library(WebviewCandidateWindow ${SOURCES})

target_include_directories(WebviewCandidateWindow PRIVATE "${PROJECT_SOURCE_DIR}/include")

if(APPLE)
    target_link_libraries(WebviewCandidateWindow "-framework WebKit" PkgConfig::NlohmannJson)
    target_compile_options(WebviewCandidateWindow PRIVATE "-Wno-auto-var-id")
elseif(LINUX)
    target_link_libraries(WebviewCandidateWindow PkgConfig::webkit2gtk PkgConfig::NlohmannJson)
endif()

add_dependencies(WebviewCandidateWindow GenerateHTML)
