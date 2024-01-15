add_executable(preview
    MACOSX_BUNDLE
    preview.mm
)

target_include_directories(preview PRIVATE "${PROJECT_SOURCE_DIR}/include")
target_link_libraries(preview WebviewCandidateWindow "-framework WebKit" "-framework Cocoa")

add_dependencies(preview patch_webview)
