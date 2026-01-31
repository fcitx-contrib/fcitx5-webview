#include "utility.hpp"
#include <sstream>

std::string base64(const std::string &s) {
    static const char *chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string ret;
    ret.reserve((s.size() + 2) / 3 * 4);
    unsigned int w = 0;
    int b = -6;
    for (unsigned char c : s) {
        w = (w << 8) + c;
        b += 8;
        while (b >= 0) {
            ret += chars[(w >> b) & 0x3F];
            b -= 6;
        }
    }
    if (b > -6)
        ret += chars[((w << 8) >> (b + 8)) & 0x3F];
    while (ret.size() % 4)
        ret += '=';
    return ret;
}
