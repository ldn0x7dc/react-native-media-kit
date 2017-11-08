#import "RCTMediaPlayerView.h"
@import AVFoundation;

// The general purpose logger. This ignores logging levels.
#ifdef DEBUG
#define RCTDPRINT(xx, ...)  NSLog(@"%s(%d): " xx, __PRETTY_FUNCTION__, __LINE__, ##__VA_ARGS__)
#else
#define RCTDPRINT(xx, ...)  ((void)0)
#endif // #ifdef DEBUG

#define RCTMediaPlayerErrorStatusStringArray @[@"Unknown",@"Failed"]

#define RCTMediaPlayerErrorStatusString(enum) [RCTMediaPlayerErrorStatusStringArray objectAtIndex:enum]


@interface RCTMediaPlayerView ()

@property (nonatomic, strong) NSTimer *progressTimer;

@end

@implementation RCTMediaPlayerView {
@private
    AVPlayer *player;
    id progressObserverHandle;
    BOOL shouldResumePlay;
    BOOL shouldContinuePlayWhenForeground;
    BOOL firstLayout;
    BOOL firstReady;
}

+ (Class)layerClass {
    return [AVPlayerLayer class];
}
- (AVPlayer*)player {
    return [(AVPlayerLayer *)[self layer] player];
}
- (void)setPlayer:(AVPlayer *)player {
    [(AVPlayerLayer *)[self layer] setPlayer:player];
}


- (instancetype) init {
    self = [super init];
    return self;
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
    RCTDPRINT(@"willMoveToWindow...%@", newWindow);
    if(!newWindow) {
        [self releasePlayer];
    }
}

- (void)willMoveToSuperview:(UIView *)newSuperview {
    RCTDPRINT(@"willMoveToSuperview...%@", newSuperview);
    if(!newSuperview) {
        [self releasePlayer];
    }
}

- (void)initPlayerIfNeeded {
    if(!player) {
        NSURL *url;
        NSString *httpPrefix = @"http";
        if ([self.src hasPrefix:httpPrefix] || [self.src hasPrefix:@"file"]) {
            url = [NSURL URLWithString:self.src];
            NSDictionary * options = nil;
            if (_httpHeaders.count > 0 && ![self.src hasPrefix:@"file"]) {
                options = @{@"AVURLAssetHTTPHeaderFieldsKey" : _httpHeaders};
            }
            AVURLAsset * asset = [AVURLAsset URLAssetWithURL:url options:options];
            AVPlayerItem * item = [AVPlayerItem playerItemWithAsset:asset];
            player = [[AVPlayer alloc] initWithPlayerItem:item];
        } else {
            NSString *resourceType = [self.src pathExtension];
            NSString *resource = [[self.src lastPathComponent] stringByDeletingPathExtension];
            NSBundle *mainBundle = [NSBundle mainBundle];
            NSString *file = [mainBundle pathForResource:resource ofType:resourceType];
            if (!file) {
                file = _src; // might be local file path other than resources
            }
            url = [NSURL fileURLWithPath:file];
            player = [AVPlayer playerWithURL:url];
        }
        [self setPlayer:player];
        [self addProgressObserver];
        [self addObservers];
        
        if(player) {
            if(self.muted) {
                player.muted = YES;
            } else {
                player.muted = NO;
            }
        }
    }
}

- (void)releasePlayer {
    if(player) {
        [player pause];
        [self removeProgressObserver];
        [self removeObservers];
        player = nil;
        firstReady = false;
    }
}

- (void) setAutoplay:(BOOL)autoplay {
    RCTDPRINT(@"setAutoplay...autoplay=%d", autoplay);
    _autoplay = autoplay;
    [self updateProps];
}

- (void) setSrc: (NSString *)uri {
    RCTDPRINT(@"setSrc...src=%@", uri);
    _src = uri;
    
    if(player) {
        [self releasePlayer];
    }
    [self updateProps];
}

- (void) setHttpHeaders:(NSDictionary *)httpHeaders {
    RCTDPRINT(@"setHTTPHeaders...");
    _httpHeaders = httpHeaders;
    [self updateProps];
}

- (void) setPreload:(NSString *)preload {
    RCTDPRINT(@"setPreload...preload=%@", preload);
    _preload = preload;
    [self updateProps];
}

- (void) setLoop:(BOOL)loop {
    RCTDPRINT(@"setLoop...loop=%d", loop);
    _loop = loop;
    [self updateProps];
}

- (void) setMuted:(BOOL)muted {
    RCTDPRINT(@"setMuted...muted=%d", muted);
    _muted = muted;
    [self updateProps];
}

- (void) layoutSubviews {
    RCTDPRINT(@"layoutSubviews...");
    [super layoutSubviews];
    firstLayout = true;
    [self updateProps];
}

- (void) updateProps {
    if(!self.src || !firstLayout) {
        return;
    }
    
    if (!player) {
        if (self.autoplay) {
            [self initPlayerIfNeeded];
            [self play];
        } else {
            if ([self.preload isEqualToString:@"none"]) {
                
            } else if ([self.preload isEqualToString:@"metadata"]) {
                
            } else if ([self.preload isEqualToString:@"auto"]) {
                [self initPlayerIfNeeded];
            }
        }
    }
    if(player) {
        if(self.muted) {
            player.muted = YES;
        } else {
            player.muted = NO;
        }
    }
}



- (void) addProgressObserver {
    if(!progressObserverHandle) {
        if(player) {
            __weak typeof(self) weakSelf = self;
            progressObserverHandle = [player addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(1, 1) queue:NULL usingBlock:^(CMTime time) {
                [weakSelf notifyPlayerProgress];
            }];
        }
        
    }
}

- (void) removeProgressObserver {
    if(progressObserverHandle) {
        if(player) {
            [player removeTimeObserver:progressObserverHandle];
            progressObserverHandle = nil;
        }
    }
}

- (void) notifyPlayerProgress {
    if(player && player.currentItem) {
        double currentTime = CMTimeGetSeconds(player.currentTime);
        double totalTime = CMTimeGetSeconds(player.currentItem.duration);
        if(isnan(currentTime) || isinf(currentTime)) {
            currentTime = 0;
        }
        if(isnan(totalTime) || isinf(totalTime)) {
            totalTime = 0;
        }
        if(self.onPlayerProgress) {
            self.onPlayerProgress(@{@"current": @(currentTime * 1000), @"total": @(totalTime * 1000)}); //in millisec
        }
    }
}

- (void) notifyPlayerBuffering {
    if(self.onPlayerBuffering) {
        self.onPlayerBuffering(nil);
    }
}

- (void) notifyPlayerBufferOK {
    if(self.onPlayerBufferOK) {
        self.onPlayerBufferOK(nil);
    }
}

- (void) notifyPlayerBufferChange: (NSArray *)ranges {
    if(self.onPlayerBufferChange) {
        self.onPlayerBufferChange(@{@"ranges": ranges});
    }
}


- (void) notifyPlayerPlaying {
    if(self.onPlayerPlaying) {
        self.onPlayerPlaying(nil);
    }
}

- (void) notifyPlayerPaused {
    if (self.onPlayerPaused) {
        self.onPlayerPaused(nil);
    }
}

- (void) notifyPlayerError:(NSError *)error {
    if (self.onPlayerError) {
        NSDictionary *map;
        if (error) {
            map = @{@"type": RCTMediaPlayerErrorStatusString(error.code), @"status": RCTMediaPlayerErrorStatusString(error.code), @"code": @(error.code), @"message": RCTNullIfNil(error.localizedDescription)};
        }
        self.onPlayerError(RCTNullIfNil(map));
    }
}

- (void) notifyPlayerFinished {
    if (self.onPlayerFinished) {
        self.onPlayerFinished(nil);
    }
}


- (void)addObservers {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationWillResignActive:)
                                                 name:UIApplicationWillResignActiveNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(applicationDidBecomeActive:)
                                                 name:UIApplicationDidBecomeActiveNotification object:nil];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemDidReachEnd:)
                                                 name:AVPlayerItemDidPlayToEndTimeNotification object:[player currentItem]];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(playerItemPlaybackStalled:)
                                                 name:AVPlayerItemPlaybackStalledNotification object:[player currentItem]];
    if (player) {
        [player addObserver:self forKeyPath:@"rate" options:0 context:nil];
        if (player.currentItem) {
            [player.currentItem addObserver:self forKeyPath:@"status" options:0 context:nil];
            [player.currentItem addObserver:self forKeyPath:@"loadedTimeRanges" options:0 context:nil];
            [player.currentItem addObserver:self forKeyPath:@"playbackBufferFull" options:0 context:nil];
            [player.currentItem addObserver:self forKeyPath:@"playbackBufferEmpty" options:0 context:nil];
        }
    }
}

- (void)removeObservers {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    if (player) {
        [player removeObserver:self forKeyPath:@"rate"];
        if (player.currentItem) {
            [player.currentItem removeObserver:self forKeyPath:@"status"];
            [player.currentItem removeObserver:self forKeyPath:@"loadedTimeRanges"];
            [player.currentItem removeObserver:self forKeyPath:@"playbackBufferFull"];
            [player.currentItem removeObserver:self forKeyPath:@"playbackBufferEmpty"];
        }
    }
}

- (void)applicationWillResignActive:(NSNotification *)notification {
    shouldContinuePlayWhenForeground = shouldResumePlay;
    [self pause];
}

- (void)applicationDidBecomeActive:(NSNotification *)notification {
    if (shouldContinuePlayWhenForeground) {
        [self play];
    }
}

- (void)playerItemDidReachEnd:(NSNotification *)notification {
    [self notifyPlayerFinished];
    if(player) {
        if (self.resetSeekTimeAfterFinish && !self.loop) {
            [player seekToTime:kCMTimeZero];
        } else if (self.loop) {
            [player seekToTime:kCMTimeZero];
            [self play];
        }
    }
}

- (void)playerItemPlaybackStalled:(NSNotification *)notification {
    [self notifyPlayerBuffering];
}

- (void) observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSString *,id> *)change context:(void *)context {
    RCTDPRINT(@"keypath: %@", keyPath);
    if(!player) {
        return;
    }
    if ([keyPath isEqualToString:@"status"]) {
        AVPlayerItem *playerItem = (AVPlayerItem *)object;
        if(playerItem.status == AVPlayerItemStatusReadyToPlay) {
            RCTDPRINT(@"status...ready to play");
            firstReady = true;
            [self notifyPlayerProgress];
            [self notifyPlayerBufferOK];
            if(player.rate != 0) {
                [self notifyPlayerPlaying];
            }
        } else if(playerItem.status == AVPlayerItemStatusUnknown) {
            RCTDPRINT(@"status...unknown");
            NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:@"Unknown", NSLocalizedDescriptionKey, nil];
            NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain code:RCTMediaPlayerErrorStatusUnknown userInfo:userInfo];
            [self notifyPlayerError:error];
        } else if(playerItem.status == AVPlayerItemStatusFailed) {
            RCTDPRINT(@"status...failed");
            NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:@"Failed", NSLocalizedDescriptionKey, nil];
            NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain code:RCTMediaPlayerErrorStatusFailed userInfo:userInfo];
            [self notifyPlayerError:error];
        }
    } else if ([keyPath isEqualToString:@"loadedTimeRanges"]) {
        NSMutableArray *array = [NSMutableArray arrayWithCapacity:1];
        for (NSValue *time in player.currentItem.loadedTimeRanges) {
            CMTimeRange range = [time CMTimeRangeValue];
            [array addObject:@{@"start": @(CMTimeGetSeconds(range.start) * 1000), @"duration": @(CMTimeGetSeconds(range.duration) * 1000)}];
        }
        [self notifyPlayerBufferChange:array];
    } else if( [keyPath isEqualToString:@"rate"]) {
        RCTDPRINT(@"rate=%f", player.rate);
        if(player.rate == 0) {
            [self notifyPlayerPaused];
        } else {
            if (firstReady) {
                [self notifyPlayerPlaying];
            } else {
                [self notifyPlayerBuffering];
            }
        }
    } else if([keyPath isEqualToString:@"playbackBufferFull"]) {
        [self notifyPlayerBufferOK];
        if (shouldResumePlay) {
            [self play];
        }
    }
}




- (void)pause {
    RCTDPRINT(@"pause...");
    if (player) {
        [player pause];
        shouldResumePlay = false;
    }
}

- (void)play {
    RCTDPRINT(@"play...");
    [self initPlayerIfNeeded];
    if(player) {
        [player play];
        shouldResumePlay = YES;
    }
}

- (void)stop {
    RCTDPRINT(@"stop...");
    if (player) {
        [player pause];
        if (self.resetSeekTimeAfterFinish) {
            [player seekToTime:kCMTimeZero];;
        }
        shouldResumePlay = false;
    }
}

- (void)seekTo: (NSTimeInterval) timeMs {
    RCTDPRINT(@"seekTo...timeMs=%f", timeMs);
    if(player) {
        CMTime cmTime = CMTimeMakeWithSeconds(timeMs/1000, 1);
        [player seekToTime:cmTime];
    }
}
@end

