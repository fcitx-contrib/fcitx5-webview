#include "utility.hpp"
#include "pugixml.hpp"
#include <sstream>

std::string escape_html(const std::string &content) {
    std::stringstream ss;
    pugi::xml_document doc;
    doc.append_child(pugi::node_pcdata).set_value(content.c_str());
    doc.print(ss, "", pugi::format_raw);
    return ss.str();
}
