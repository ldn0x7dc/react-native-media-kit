#import "RCTMediaPlayerManager.h"
#import "RCTMediaPlayerView.h"
#import "RCTUIManager.h"

@implementation RCTMediaPlayerManager

RCT_EXPORT_MODULE(RCTMediaPlayerView)

- (UIView *) view {
  return [[RCTMediaPlayerView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(autoplay, BOOL)
RCT_EXPORT_VIEW_PROPERTY(src, NSString*)
RCT_EXPORT_VIEW_PROPERTY(preload, NSString*)
RCT_EXPORT_VIEW_PROPERTY(loop, BOOL)

RCT_EXPORT_VIEW_PROPERTY(onPlayerPaused, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerPlaying, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerFinished, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerBuffering, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerBufferOK, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPlayerProgress, RCTBubblingEventBlock)

//RCT_CUSTOM_VIEW_PROPERTY(uri, NSString, RCTMediaPlayerView) {
//  [view setUri:json?: NULL];
//}

- (NSDictionary<NSString *, id> *)constantsToExport {
  return [super constantsToExport];
}

RCT_EXPORT_METHOD(pause:(nonnull NSNumber *)reactTag) {
  [self executeBlock:^(RCTMediaPlayerView *view) {
    [view pause];
  } withTag:reactTag];
}

RCT_EXPORT_METHOD(stop:(nonnull NSNumber *)reactTag) {
  [self executeBlock:^(RCTMediaPlayerView *view) {
    [view stop];
  } withTag:reactTag];
}

RCT_EXPORT_METHOD(play:(nonnull NSNumber *)reactTag) {
  [self executeBlock:^(RCTMediaPlayerView *view) {
    [view play];
  } withTag:reactTag];
}

RCT_EXPORT_METHOD(seekTo:(nonnull NSNumber *)reactTag :(double)timeMs) {
  [self executeBlock:^(RCTMediaPlayerView *view) {
    [view seekTo:timeMs];
  } withTag:reactTag];
}


typedef void (^RCTMediaPlayerViewManagerBlock)(RCTMediaPlayerView *view);

- (void)executeBlock:(RCTMediaPlayerViewManagerBlock)block withTag:(nonnull NSNumber *)reactTag {
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTMediaPlayerView *> *viewRegistry) {
    RCTMediaPlayerView *view = viewRegistry[reactTag];
    if (![view isKindOfClass:[RCTMediaPlayerView class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting RCTMediaPlayerView, got: %@", view);
    } else {
      block(view);
    }
  }];
}

@end
