#include "webview_candidate_window.hpp"
#include <QuartzCore/QuartzCore.h>
#include <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
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
@property(nonatomic, strong) NSVisualEffectView *visualView;
@property(nonatomic, strong)
    NSGlassEffectView *glassView API_AVAILABLE(macos(26.0));
@property(nonatomic, assign) NSView *blurView;
@property(nonatomic, assign)
    candidate_window::WebviewCandidateWindow *candidateWindow;

@end

@implementation HoverableWindow

- (BOOL)isKeyWindow {
    return YES;
}

- (void)effectiveAppearanceChanged:(NSAppearance *)appearance {
    if ([appearance bestMatchFromAppearancesWithNames:@[
            NSAppearanceNameDarkAqua, NSAppearanceNameAqua
        ]] == NSAppearanceNameDarkAqua) {
        self.candidateWindow->set_theme(candidate_window::dark);
    } else {
        self.candidateWindow->set_theme(candidate_window::light);
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey, id> *)change
                       context:(void *)context {
    if ([keyPath isEqualToString:@"effectiveAppearance"]) {
        [self effectiveAppearanceChanged:change[NSKeyValueChangeNewKey]];
    } else {
        [super observeValueForKeyPath:keyPath
                             ofObject:object
                               change:change
                              context:context];
    }
}

- (void)initAppearanceObserver {
    if (@available(macOS 26.0, *)) {
        [self.glassView.contentView addObserver:self
                                     forKeyPath:@"effectiveAppearance"
                                        options:NSKeyValueObservingOptionNew |
                                                NSKeyValueObservingOptionInitial
                                        context:NULL];
    }
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
    UTType *type = [UTType typeWithFilenameExtension:pathExtension];
    NSString *mimeType = @"application/octet-stream";
    if (type && type.preferredMIMEType) {
        mimeType = type.preferredMIMEType;
    }
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

static void setViewCornerRadius(NSView *view, CGFloat width, CGFloat height,
                                CGFloat top_left_radius,
                                CGFloat top_right_radius,
                                CGFloat bottom_right_radius,
                                CGFloat bottom_left_radius) {
    CGMutablePathRef path = CGPathCreateMutable();
    CGFloat minX = 0;
    CGFloat minY = 0;
    CGFloat maxX = width;
    CGFloat maxY = height;
    // 从左下角开始，顺时针
    CGPathMoveToPoint(path, NULL, minX + bottom_left_radius, minY);
    CGPathAddLineToPoint(path, NULL, maxX - bottom_right_radius, minY);
    if (bottom_right_radius > 0) {
        CGPathAddArc(path, NULL, maxX - bottom_right_radius,
                     minY + bottom_right_radius, bottom_right_radius,
                     M_PI + M_PI_2, 0, false);
    }
    CGPathAddLineToPoint(path, NULL, maxX, maxY - top_right_radius);
    if (top_right_radius > 0) {
        CGPathAddArc(path, NULL, maxX - top_right_radius,
                     maxY - top_right_radius, top_right_radius, 0, M_PI_2,
                     false);
    }
    CGPathAddLineToPoint(path, NULL, minX + top_left_radius, maxY);
    if (top_left_radius > 0) {
        CGPathAddArc(path, NULL, minX + top_left_radius, maxY - top_left_radius,
                     top_left_radius, M_PI_2, M_PI, false);
    }
    CGPathAddLineToPoint(path, NULL, minX, minY + bottom_left_radius);
    if (bottom_left_radius > 0) {
        CGPathAddArc(path, NULL, minX + bottom_left_radius,
                     minY + bottom_left_radius, bottom_left_radius, M_PI,
                     M_PI + M_PI_2, false);
    }
    CGPathCloseSubpath(path);

    CAShapeLayer *mask = [CAShapeLayer layer];
    mask.path = path;
    view.layer.mask = mask;
    CGPathRelease(path);
}

void WebviewCandidateWindow::platform_init() {
    auto listener = [[NotificationListener alloc] init];
    [listener setCandidateWindow:this];
    [[NSNotificationCenter defaultCenter]
        addObserver:listener
           selector:@selector(accentColorChanged:)
               name:NSSystemColorsDidChangeNotification
             object:nil];
    platform_data = listener;
    system_ = "macOS";
    NSOperatingSystemVersion version =
        [[NSProcessInfo processInfo] operatingSystemVersion];
    version_ = version.majorVersion;
}

void *WebviewCandidateWindow::create_window() {
    auto window =
        [[HoverableWindow alloc] initWithContentRect:NSMakeRect(0, 0, 400, 300)
                                           styleMask:0
                                             backing:NSBackingStoreBuffered
                                               defer:YES];
    [window setLevel:NSPopUpMenuWindowLevel];
    window.candidateWindow = this;
    return window;
}

WebviewCandidateWindow::~WebviewCandidateWindow() {
    [(id)w_->window() close]; // By default NSWindow is released on close.
    auto listener = static_cast<NotificationListener *>(this->platform_data);
    [listener release];
}

void WebviewCandidateWindow::set_transparent_background() {
    HoverableWindow *window = static_cast<HoverableWindow *>(w_->window());

    // Transparent NSWindow
    window.opaque = NO;
    [window setBackgroundColor:[NSColor clearColor]];

    // Transparent WKWebView
    WKWebView *webView = static_cast<WKWebView *>(w_->widget());
    [webView setValue:@NO forKey:@"drawsBackground"];
    [webView setUnderPageBackgroundColor:[NSColor clearColor]];

    // From now on, replace the old contentView of the window (which
    // happens to be exactly webView) with a new content view. Our view
    // hierarchy is: NSWindow
    // +--- NSView (contentView)
    //      +--- NSVisualEffectView/NSGlassEffectView (blurView)
    //      +--- WKWebView (webView)
    // both blurView and webView fill the entire contentView,
    // but blurView is at the bottom.
    [webView removeFromSuperview];

    auto contentView = [NSView new];
    contentView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;

    auto visualView = [NSVisualEffectView new];
    visualView.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
    visualView.translatesAutoresizingMaskIntoConstraints = NO;
    visualView.material = NSVisualEffectMaterialHUDWindow;
    visualView.blendingMode = NSVisualEffectBlendingModeBehindWindow;
    visualView.state = NSVisualEffectStateActive;
    visualView.wantsLayer = YES;
    visualView.hidden = YES;
    window.visualView = visualView;

    if (@available(macOS 26, *)) {
        auto glassView = [NSGlassEffectView new];
        glassView.wantsLayer = YES;
        glassView.hidden = YES;
        glassView.contentView = [NSView new];
        ((void (*)(id, SEL, int))objc_msgSend)(glassView,
                                               @selector(set_variant:), 15);
        window.glassView = glassView;
        [window initAppearanceObserver];
        window.blurView = glassView;
    } else {
        window.blurView = visualView;
    }

    [contentView addSubview:webView];
    window.contentView = contentView;

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

void WebviewCandidateWindow::hide() const {
    auto window = static_cast<NSWindow *>(w_->window());
    [window orderBack:nil];
    [window setIsVisible:NO];
    hidden_ = true;
    epoch += 1;
    invoke_js("hidePanel");
}

void WebviewCandidateWindow::write_clipboard(const std::string &html) {
    NSString *s = [NSString stringWithUTF8String:html.c_str()];
    NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
    [pasteboard clearContents];
    [pasteboard setString:s forType:NSPasteboardTypeString];
}

void WebviewCandidateWindow::resize(
    double dx, double dy, double anchor_top, double anchor_right,
    double anchor_bottom, double anchor_left, double panel_top,
    double panel_right, double panel_bottom, double panel_left,
    double top_left_radius, double top_right_radius, double bottom_right_radius,
    double bottom_left_radius, double border_width, double width, double height,
    bool dragging) {
    const int gap = 4;
    NSRect frame = getNearestScreenFrame(caret_x_, caret_y_);
    double left = NSMinX(frame);
    double right = NSMaxX(frame);
    double top = NSMaxY(frame);
    double bottom = NSMinY(frame);
    // Yes, there is no guarantee that caret is within the screen.
    double adjusted_x = std::min(std::max(caret_x_, left), right);
    double adjusted_y = std::min(std::max(caret_y_, bottom), top);

    if (dragging) {
        x_ += dx;
        y_ -= dy; // minus because macOS has bottom-left (0, 0)
    } else {
        if (layout_ == layout_t::vertical &&
            writing_mode_ == writing_mode_t::vertical_rl) {
            // Right side of the window needs to align with the caret as
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
            y_ = std::max<double>(adjusted_y + caret_height_ + gap, bottom) -
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
    // Shrink the blur view a bit to avoid the border being too thick.
    // Don't shrink full border_width so that there is no ghost stripe.
    double shrink_width = border_width / 2;
    panel_right -= shrink_width;
    panel_left += shrink_width;
    panel_top += shrink_width;
    panel_bottom -= shrink_width;
    window.blurViewRect =
        NSMakeRect(panel_left, height - panel_bottom,
                   std::min(panel_right - panel_left, width),
                   std::min(panel_bottom - panel_top, height));
    if (!window.blurView.hidden) {
        [window.blurView setFrame:window.blurViewRect];
        setViewCornerRadius(window.blurView, window.blurViewRect.size.width,
                            window.blurViewRect.size.height, top_left_radius,
                            top_right_radius, bottom_right_radius,
                            bottom_left_radius);
    }

    // A User reported Bob.app called out by shortcut is above candidate
    // window on M1. While I can't reproduce it on Intel, he tested this and
    // believed it's fixed. This trick is learned from vChewing.
    // CGShieldingWindowLevel returns 2147483628, while
    // kCGPopUpMenuWindowLevel is 101 (same with window level without this).
    [window setLevel:std::max<int>(CGShieldingWindowLevel(),
                                   kCGPopUpMenuWindowLevel) +
                     1];
    [window setIsVisible:YES];
}

void WebviewCandidateWindow::set_native_blur(blur_t value) const {
    HoverableWindow *window = static_cast<HoverableWindow *>(w_->window());
    if (window.blurView.hidden == NO) {
        [window.blurView removeFromSuperview];
    }
    if (value == blur_t::none) {
        window.blurView.hidden = YES;
    } else {
        if (@available(macOS 26, *)) {
            if (value == blur_t::system || value == blur_t::liquid_glass) {
                window.blurView = window.glassView;
                [window effectiveAppearanceChanged:window.glassView.contentView
                                                       .effectiveAppearance];
            } else {
                window.blurView = window.visualView;
            }
        } else {
            window.blurView = window.visualView;
        }
        WKWebView *webView = static_cast<WKWebView *>(w_->widget());
        NSView *contentView = window.contentView;
        [contentView addSubview:window.blurView
                     positioned:NSWindowBelow
                     relativeTo:webView];
        [window.blurView setFrame:window.blurViewRect];
        window.blurView.hidden = NO;
    }
}

void WebviewCandidateWindow::set_native_shadow(bool enabled) const {
    HoverableWindow *window = static_cast<HoverableWindow *>(w_->window());
    if (enabled) {
        [window setHasShadow:YES];
    } else {
        [window setHasShadow:NO];
    }
}
} // namespace candidate_window
