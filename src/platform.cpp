#if defined(__APPLE__)
#include "platform/macos.mm"
#elif defined(__linux__)
#include "platform/linux.cpp"
#elif defined(__EMSCRIPTEN__)
#include "platform/js.cpp"
#else
#error "Unsupported platform"
#endif
