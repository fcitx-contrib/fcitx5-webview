#include "curl.hpp"
#include <atomic>
#include <cassert>
#include <stdexcept>
#include <thread>
#include <unistd.h>

static size_t _on_data_cb(char *data, size_t size, size_t nmemb,
                          std::string *outbuf);
std::mutex m;
std::atomic<bool> running;

CurlMultiManager &CurlMultiManager::shared() {
    static CurlMultiManager instance;
    return instance;
}

CurlMultiManager::CurlMultiManager() {
    bool expected = false;
    if (!running.compare_exchange_strong(expected, true)) {
        throw std::runtime_error("should only run one curl manager");
    }
    if (pipe(controlfd) < 0) {
        throw std::runtime_error("failed to create curl control pipe");
    }
    curl_global_init(CURL_GLOBAL_ALL);
    multi = curl_multi_init();
    worker_thread = std::thread(&CurlMultiManager::run, this);
}

CurlMultiManager::~CurlMultiManager() {
    write(controlfd[1], "q", 1);
    if (worker_thread.joinable()) {
        worker_thread.join();
    }
    curl_multi_cleanup(multi);
    curl_global_cleanup();
    close(controlfd[0]);
    close(controlfd[1]);
    running.store(false);
}

void CurlMultiManager::add(CURL *easy, CurlMultiManager::Callback callback) {
    {
        std::unique_lock g(m);
        buf[easy] = "";
        cb[easy] = callback;
    }
    curl_easy_setopt(easy, CURLOPT_WRITEFUNCTION, _on_data_cb);
    curl_easy_setopt(easy, CURLOPT_WRITEDATA, &buf[easy]);
    curl_multi_add_handle(multi, easy);
    std::atomic_thread_fence(std::memory_order_seq_cst);
    write(controlfd[1], "a", 1);
}

void CurlMultiManager::run() {
    while (true) {
        int still_running = 0;
        int ret;
        ret = curl_multi_perform(multi, &still_running);
        int numfds;
        struct curl_waitfd wfd;
        wfd.fd = controlfd[0];
        wfd.events = CURL_WAIT_POLLIN;
        wfd.revents = 0;
        curl_multi_poll(multi, &wfd, 1, 1000, &numfds);
        std::atomic_thread_fence(std::memory_order_seq_cst);
        if (wfd.revents) {
            char cmd;
            read(controlfd[0], &cmd, 1);
            switch (cmd) {
            case 'q': // quit
                return;
            case 'a': // added a new handle
                break;
            default:
                assert(false && "unreachable");
            }
        }
        CURLMsg *msg;
        int msgs_left;
        while ((msg = curl_multi_info_read(multi, &msgs_left))) {
            if (msg->msg == CURLMSG_DONE) {
                CURL *easy = msg->easy_handle;
                CURLcode res = msg->data.result;
                {
                    // do this because the cb might be slow
                    std::shared_lock g(m);
                    cb[easy](res, easy, buf[easy]);
                }
                curl_multi_remove_handle(multi, easy);
                curl_easy_cleanup(easy);
                {
                    std::unique_lock g(m);
                    cb.erase(easy);
                    buf.erase(easy);
                }
            }
        }
    }
}

size_t _on_data_cb(char *data, size_t size, size_t nmemb, std::string *outbuf) {
    size_t realsize = size * nmemb;
    outbuf->append(data, realsize);
    return realsize;
}
