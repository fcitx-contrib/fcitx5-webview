#pragma once

#include <curl/curl.h>
#include <shared_mutex>

class CurlMultiManager {
  public:
    using Callback = std::function<void(CURLcode, CURL *, const std::string &)>;
    using HandleData = std::pair<CURL *, Callback>;

    static CurlMultiManager &shared();
    CurlMultiManager();
    ~CurlMultiManager();
    void add(CURL *easy, CurlMultiManager::Callback cb);

  private:
    CURLM *multi;
    std::thread worker_thread;
    int controlfd[2];
    std::shared_mutex m;
    std::unordered_map<CURL *, std::string> buf;
    std::unordered_map<CURL *, Callback> cb;

    void run();
};
