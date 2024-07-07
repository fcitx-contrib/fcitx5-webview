if(APPLE)
    add_executable(preview
        MACOSX_BUNDLE
        preview.mm
    )
    target_link_libraries(preview WebviewCandidateWindow "-framework WebKit" "-framework Cocoa")
    target_compile_options(preview PRIVATE "-Wno-auto-var-id")
elseif(LINUX)
    add_executable(preview preview.cpp)
    target_link_libraries(preview WebviewCandidateWindow)
endif()

target_include_directories(preview PRIVATE "${PROJECT_SOURCE_DIR}/include")

add_dependencies(preview GenerateHTML)
