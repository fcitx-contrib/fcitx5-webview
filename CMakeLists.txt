cmake_minimum_required(VERSION 3.27)

project(fcitx5-webview)

set(CMAKE_CXX_STANDARD 17)

option(BUILD_PREVIEW "Build preview app for development" ON)

if(NOT CMAKE_OSX_ARCHITECTURES)
    set(CMAKE_OSX_ARCHITECTURES "${CMAKE_HOST_SYSTEM_PROCESSOR}")
endif()

find_package(PkgConfig REQUIRED)
pkg_check_modules(NlohmannJson REQUIRED IMPORTED_TARGET "nlohmann_json")

include_directories(pugixml/src)
include_directories(webview)

file(GLOB HTML_SOURCES CONFIGURE_DEPENDS "page/*")
add_custom_command(
    OUTPUT ${PROJECT_SOURCE_DIR}/include/html_template.hpp
    COMMAND pnpm run clean && pnpm run build
    COMMAND xxd -n HTML_TEMPLATE -i "${PROJECT_SOURCE_DIR}/dist/index.html" > "${PROJECT_SOURCE_DIR}/include/html_template.hpp"
    DEPENDS ${HTML_SOURCES}
    WORKING_DIRECTORY ${PROJECT_SOURCE_DIR}
    COMMENT "Generating the HTML template..."
)
add_custom_target(GenerateHTML ALL
    DEPENDS ${PROJECT_SOURCE_DIR}/include/html_template.hpp
)

add_subdirectory(src)

if(BUILD_PREVIEW)
    add_subdirectory(preview)
endif()
