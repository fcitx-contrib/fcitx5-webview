#if defined(__APPLE__)
#include "platform/macos.mm"
#elif defined(__linux__)
#include "platform/linux.cpp"
#else
#error "Unsupported platform"
#endif
