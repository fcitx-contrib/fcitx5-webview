cmake_minimum_required(VERSION 3.27)

project(fcitx5-webview)

set(CMAKE_CXX_STANDARD 17)

option(BUILD_PREVIEW "Build preview app for development" ON)

if(NOT CMAKE_OSX_ARCHITECTURES)
    set(CMAKE_OSX_ARCHITECTURES "${CMAKE_HOST_SYSTEM_PROCESSOR}")
endif()

find_package(PkgConfig REQUIRED)
pkg_check_modules(NlohmannJson REQUIRED IMPORTED_TARGET "nlohmann_json")

include_directories(webview)
add_custom_target(patch_webview
    COMMAND git reset --hard
    COMMAND git apply "${PROJECT_SOURCE_DIR}/patches/webview.patch"
    WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}/webview"
)

file(READ "${PROJECT_SOURCE_DIR}/index.html" HTML_TEMPLATE)
configure_file("${PROJECT_SOURCE_DIR}/include/html_template.hpp.in"
    "${PROJECT_SOURCE_DIR}/include/html_template.hpp"
)

add_subdirectory(src)

if(BUILD_PREVIEW)
    add_subdirectory(preview)
endif()
