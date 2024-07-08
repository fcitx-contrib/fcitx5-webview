add_executable(preview preview.cpp)
target_link_libraries(preview WebviewCandidateWindow)
target_include_directories(preview PRIVATE "${PROJECT_SOURCE_DIR}/include")

if(APPLE)
    target_compile_options(preview PRIVATE "-Wno-auto-var-id" "-ObjC++")
endif()

add_dependencies(preview GenerateHTML)
