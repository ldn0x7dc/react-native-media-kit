#import <UIKit/UIKit.h>
#import "RCTComponent.h"


@interface RCTMediaPlayerView : UIView


@property (nonatomic, strong) RCTDirectEventBlock onPlayerPlaying;
@property (nonatomic, strong) RCTDirectEventBlock onPlayerPaused;
@property (nonatomic, strong) RCTDirectEventBlock onPlayerProgress;
@property (nonatomic, strong) RCTDirectEventBlock onPlayerBuffering;
@property (nonatomic, strong) RCTDirectEventBlock onPlayerBufferOK;
@property (nonatomic, strong) RCTDirectEventBlock onPlayerFinished;
@property (nonatomic) BOOL autoplay;



- (void)setUri: (NSString *)uri;

- (void)pause;
- (void)play;
- (void)seekTo: (NSTimeInterval)timeInSec;

@end
