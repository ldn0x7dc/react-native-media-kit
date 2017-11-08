#import <UIKit/UIKit.h>

#if __has_include(<React/RCTAssert.h>)
#import <React/RCTComponent.h>
#import <React/RCTUtils.h>
#else
#import "RCTComponent.h"
#import "RCTUtils.h"
#endif

typedef NS_ENUM(NSInteger, RCTMediaPlayerErrorStatus) {
    RCTMediaPlayerErrorStatusUnknown,
    RCTMediaPlayerErrorStatusFailed
};

@interface RCTMediaPlayerView : UIView


@property (nonatomic, strong) RCTBubblingEventBlock onPlayerPlaying;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerPaused;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerProgress;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerBuffering;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerBufferOK;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerFinished;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerError;
@property (nonatomic, strong) RCTBubblingEventBlock onPlayerBufferChange;

@property (nonatomic) BOOL autoplay;
@property (nonatomic) NSString* src;
@property (nonatomic) NSDictionary* httpHeaders;
@property (nonatomic) NSString* preload; //could be "none", "metadata", "auto"
@property (nonatomic) BOOL loop;
@property (nonatomic) BOOL resetSeekTimeAfterFinish;
@property (nonatomic) BOOL muted;


- (void)pause;
- (void)play;
- (void)stop;
- (void)seekTo: (NSTimeInterval)timeInSec;

@end

