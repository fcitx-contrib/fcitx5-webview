if(APPLE)
    add_executable(preview MACOSX_BUNDLE preview.cpp)
    target_compile_options(preview PRIVATE "-Wno-auto-var-id" "-ObjC++")
else()
    add_executable(preview preview.cpp)
endif()

target_link_libraries(preview WebviewCandidateWindow)
target_include_directories(preview PRIVATE "${PROJECT_SOURCE_DIR}/include")

add_dependencies(preview GenerateHTML)
