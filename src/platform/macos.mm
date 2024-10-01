#include "webview_candidate_window.hpp"
#include <CoreGraphics/CoreGraphics.h>
#include <WebKit/WKWebView.h>

NSString *const F5mErrorDomain = @"F5mErrorDomain";

@interface NotificationListener : NSObject

@property(nonatomic, assign)
    candidate_window::WebviewCandidateWindow *candidateWindow;
- (void)accentColorChanged:(NSNotification *)notification;

@end

@implementation NotificationListener

- (void)accentColorChanged:(NSNotification *)notification {
    self.candidateWindow->update_accent_color();
    self.candidateWindow->set_accent_color();
}

@end

@interface HoverableWindow : NSWindow

@property(nonatomic) NSRect blurViewRect;
@property(nonatomic, strong) NSVisualEffectView *blurView;

@end

@implementation HoverableWindow

- (BOOL)isKeyWindow {
    return YES;
}

@end

#ifdef WKWEBVIEW_PROTOCOL
@implementation FileSchemeHandler

// In f5m, it serves fcitx:///file/foo/bar from
// ~/.local/share/fcitx5/www/foo/bar
- (void)webView:(WKWebView *)webView
    startURLSchemeTask:(id<WKURLSchemeTask>)urlSchemeTask {
    NSURL *url = urlSchemeTask.request.URL;
    if (!url || ![url.path hasPrefix:@"/file"]) {
        [urlSchemeTask didFailWithError:[NSError errorWithDomain:F5mErrorDomain
                                                            code:0
                                                        userInfo:nil]];
        return;
    }
    NSString *filePath = [url.path substringFromIndex:[@"/file" length]];
    std::cerr << "Accessing " << [filePath UTF8String] << " from webview"
              << std::endl;
    NSString *homeDirectory = NSHomeDirectory();
    NSString *localFilePath =
        [[homeDirectory stringByAppendingString:@"/" WEBVIEW_WWW_PATH]
            stringByAppendingString:filePath];
#ifndef NDEBUG
    std::cerr << "Resolved to " << [localFilePath UTF8String] << std::endl;
#endif
    NSURL *fileURL = [NSURL fileURLWithPath:localFilePath];

    NSData *data = [NSData dataWithContentsOfURL:fileURL];
    if (data) {
        NSString *mimeType = [self mimeTypeForPath:fileURL.path];
        NSURLResponse *response = [[NSURLResponse alloc] initWithURL:url
                                                            MIMEType:mimeType
                                               expectedContentLength:data.length
                                                    textEncodingName:nil];
        [urlSchemeTask didReceiveResponse:response];
        [urlSchemeTask didReceiveData:data];
        [urlSchemeTask didFinish];
        [response release];
    } else {
        [urlSchemeTask didFailWithError:[NSError errorWithDomain:F5mErrorDomain
                                                            code:404
                                                        userInfo:nil]];
    }
}

- (void)webView:(WKWebView *)webView
    stopURLSchemeTask:(id<WKURLSchemeTask>)urlSchemeTask {
}

- (NSString *)mimeTypeForPath:(NSString *)path {
    NSString *pathExtension = [path pathExtension];
    CFStringRef type = UTTypeCreatePreferredIdentifierForTag(
        kUTTagClassFilenameExtension, (__bridge CFStringRef)pathExtension,
        NULL);
    NSString *mimeType = @"application/octet-stream";
    if (!type)
        return mimeType;
    CFStringRef mimeTypeRef =
        UTTypeCopyPreferredTagWithClass(type, kUTTagClassMIMEType);
    if (mimeTypeRef) {
        mimeType = (NSString *)mimeTypeRef;
    }
    CFRelease(type);
    return mimeType;
}

@end
#endif

NSRect getNearestScreenFrame(double x, double y) {
    // mainScreen is not where (0,0) is in, but screen of focused window.
    NSRect frame = [NSScreen mainScreen].frame;
    NSPoint point = NSMakePoint(x, y);
    NSArray *screens = [NSScreen screens];
    for (NSUInteger i = 0; i < screens.count; ++i) {
        NSRect rect = [screens[i] frame];
        // In Firefox Google Docs, reported coordicates may be outside any
        // screen, so distance-based selection is worse than point-in-screen
        // check as fallback is mainScreen.
        if (NSPointInRect(point, rect)) {
            frame = rect;
            break;
        }
    }
    return frame;
}

namespace candidate_window {

void WebviewCandidateWindow::platform_init() {
    auto listener = [[NotificationListener alloc] init];
    [listener setCandidateWindow:this];
    [[NSDistributedNotificationCenter defaultCenter]
        addObserver:listener
           selector:@selector(accentColorChanged:)
               name:@"AppleColorPreferencesChangedNotification"
             object:nil];
    platform_data = listener;
}

void *WebviewCandidateWindow::create_window() {
    auto window =
        [[HoverableWindow alloc] initWithContentRect:NSMakeRect(0, 0, 400, 300)
                                           styleMask:0
                                             backing:NSBackingStoreBuffered
                                               defer:YES];
    [window setLevel:NSPopUpMenuWindowLevel];
    return window;
}

WebviewCandidateWindow::~WebviewCandidateWindow() {
    [(id)w_->window() close]; // By default NSWindow is released on close.
    auto listener = static_cast<NotificationListener *>(this->platform_data);
    [listener release];
}

void WebviewCandidateWindow::set_transparent_background() {
    HoverableWindow *win = static_cast<HoverableWindow *>(w_->window());

    // Transparent NSWindow
    win.opaque = NO;
    [win setBackgroundColor:[NSColor clearColor]];

    // Transparent WKWebView
    WKWebView *webView = static_cast<WKWebView *>(w_->widget());
    [webView setValue:@NO forKey:@"drawsBackground"];
    [webView setUnderPageBackgroundColor:[NSColor clearColor]];

    // From now on, replace the old contentView of the window (which
    // happens to be exactly webView) with a new content view. Our view
    // hierarchy is: NSWindow
    // +--- NSView (contentView)
    //      +--- NSVisualEffectView (blurView)
    //      +--- WKWebView (webView)
    // both blurView and webView fill the entire contentView,
    // but blurView is at the bottom.
    [webView removeFromSuperview];

    auto contentView = [NSView new];
    contentView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;

    auto blurView = [NSVisualEffectView new];
    blurView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    blurView.material = NSVisualEffectMaterialHUDWindow;
    blurView.blendingMode = NSVisualEffectBlendingModeBehindWindow;
    blurView.state = NSVisualEffectStateActive;
    blurView.wantsLayer = YES;
    blurView.translatesAutoresizingMaskIntoConstraints = NO;
    blurView.hidden = YES;
    win.blurView = blurView;

    [contentView addSubview:webView];
    win.contentView = contentView;

    // Fix the layout for webView; make sure it fills the entire container.
    webView.translatesAutoresizingMaskIntoConstraints = NO;
    [NSLayoutConstraint activateConstraints:@[
        [webView.leadingAnchor
            constraintEqualToAnchor:contentView.leadingAnchor],
        [webView.trailingAnchor
            constraintEqualToAnchor:contentView.trailingAnchor],
        [webView.topAnchor constraintEqualToAnchor:contentView.topAnchor],
        [webView.bottomAnchor constraintEqualToAnchor:contentView.bottomAnchor]
    ]];
}

void WebviewCandidateWindow::update_accent_color() {
    NSNumber *accentColor = [[NSUserDefaults standardUserDefaults]
        objectForKey:@"AppleAccentColor"];
    if (accentColor == nil) {
        accent_color_nil_ = true;
    } else {
        accent_color_nil_ = false;
        accent_color_ = [accentColor intValue];
    }
}

void WebviewCandidateWindow::hide() {
    auto window = static_cast<NSWindow *>(w_->window());
    [window orderBack:nil];
    [window setIsVisible:NO];
    hidden_ = true;
    epoch += 1;
}

void WebviewCandidateWindow::write_clipboard(const std::string &html) {
    NSString *s = [NSString stringWithUTF8String:html.c_str()];
    NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
    [pasteboard clearContents];
    [pasteboard setString:s forType:NSPasteboardTypeString];
}

void WebviewCandidateWindow::resize(double dx, double dy, double anchor_top,
                                    double anchor_right, double anchor_bottom,
                                    double anchor_left, double panel_top,
                                    double panel_right, double panel_bottom,
                                    double panel_left, double panel_radius,
                                    double border_width, double width,
                                    double height, bool dragging) {
    const int gap = 4;
    const int preedit_height = 24;
    NSRect frame = getNearestScreenFrame(cursor_x_, cursor_y_);
    double left = NSMinX(frame);
    double right = NSMaxX(frame);
    double top = NSMaxY(frame);
    double bottom = NSMinY(frame);
    // Yes, there is no guarantee that cursor is within the screen.
    double adjusted_x = std::min(std::max(cursor_x_, left), right);
    double adjusted_y = std::min(std::max(cursor_y_, bottom), top);

    if (dragging) {
        x_ += dx;
        y_ -= dy; // minus because macOS has bottom-left (0, 0)
    } else {
        if (layout_ == layout_t::vertical &&
            writing_mode_ == writing_mode_t::vertical_rl) {
            // Right side of the window needs to align with the cursor as
            // the first candidate is on the right.
            x_ = adjusted_x - anchor_right;
            x_ = std::max<double>(x_, left - anchor_left);
            x_ = std::min<double>(x_, right - anchor_right);
        } else {
            x_ = adjusted_x - anchor_left;
            x_ = std::min<double>(x_, right - anchor_right);
            x_ = std::max<double>(x_, left - anchor_left);
        }
        if (anchor_bottom - anchor_top + gap >
                adjusted_y - bottom        // No enough space underneath
            || (!hidden_ && was_above_)) { // It was above, avoid flicker
            y_ = std::max<double>(adjusted_y + preedit_height + gap, bottom) -
                 (height - anchor_bottom);
            y_ = std::min<double>(y_, top - (height - anchor_top));
            was_above_ = true;
        } else {
            y_ = adjusted_y - gap - (height - anchor_top);
            was_above_ = false;
        }
    }
    hidden_ = false;
    HoverableWindow *window = static_cast<HoverableWindow *>(w_->window());
    [window setFrame:NSMakeRect(x_, y_, width, height) display:YES animate:NO];
    [window orderFront:nil];

    // Update the blur view
    panel_right -= border_width; // Shrink the blur view a bit
    panel_left += border_width;  // to avoid the border being too thick.
    panel_top += border_width;
    panel_bottom -= border_width;
    auto blurView = window.blurView;
    NSRect blurViewRect =
        NSMakeRect(panel_left, height - panel_bottom,
                   std::min(panel_right - panel_left, width),
                   std::min(panel_bottom - panel_top, height));
    if (blurView.hidden) {
        window.blurViewRect = blurViewRect;
    } else {
        [window.blurView setFrame:blurViewRect];
        window.blurView.layer.cornerRadius = panel_radius;
    }

    // A User reported Bob.app called out by shortcut is above candidate
    // window on M1. While I can't reproduce it on Intel, he tested this and
    // belived it's fixed. This trick is learned from vChewing.
    // CGShieldingWindowLevel returns 2147483628, while
    // kCGPopUpMenuWindowLevel is 101 (same with window level without this).
    [window setLevel:std::max<int>(CGShieldingWindowLevel(),
                                   kCGPopUpMenuWindowLevel) +
                     1];
    [window setIsVisible:YES];
}

void WebviewCandidateWindow::set_native_blur(bool enabled) {
    HoverableWindow *window = static_cast<HoverableWindow *>(w_->window());
    dispatch_async(dispatch_get_main_queue(), ^{
      if (enabled) {
          WKWebView *webView = static_cast<WKWebView *>(w_->widget());
          NSView *contentView = window.contentView;
          [contentView addSubview:window.blurView
                       positioned:NSWindowBelow
                       relativeTo:webView];
          [window.blurView setFrame:window.blurViewRect];
          window.blurView.hidden = NO;
      } else {
          window.blurView.hidden = YES;
          [window.blurView removeFromSuperview];
      }
    });
}

void WebviewCandidateWindow::set_native_shadow(bool enabled) {
    HoverableWindow *window = static_cast<HoverableWindow *>(w_->window());
    dispatch_async(dispatch_get_main_queue(), ^{
      if (enabled) {
          [window setHasShadow:YES];
      } else {
          [window setHasShadow:NO];
      }
    });
}
} // namespace candidate_window
