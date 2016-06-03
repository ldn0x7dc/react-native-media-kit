#import "RCTMediaPlayerView.h"
@import MediaPlayer;

@interface RCTMediaPlayerView ()

@property (nonatomic, strong) NSTimer *progressTimer;

@end

@implementation RCTMediaPlayerView {
@private
  double lastCurrent;
  double lastTotal;
  MPMoviePlayerController *playerController;
}

- (instancetype) init {
  self = [super init];
  if (self) {
    lastCurrent = -1;
    lastTotal = -1;
  }
  return self;
}

- (void)dealloc{
  NSLog(@"dealloc...");
  if(playerController) {
    [playerController stop];
  }
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)willMoveToWindow:(UIWindow *)newWindow {
  NSLog(@"willMoveToWindow...%@", newWindow);
  if(!newWindow && playerController) {
    [playerController stop];
  }
}

- (void)initPlayerControllerIfNeeded {
  if(!playerController) {
    playerController = [[MPMoviePlayerController alloc] init];
    playerController.controlStyle = MPMovieControlStyleNone;
    playerController.shouldAutoplay = NO;
    playerController.repeatMode = MPMovieRepeatModeNone;
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMoviePlayerPlaybackDidFinishNotification object:playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMoviePlayerLoadStateDidChangeNotification object:playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMovieDurationAvailableNotification object:playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMovieNaturalSizeAvailableNotification object:playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMoviePlayerPlaybackStateDidChangeNotification object:playerController];
    
    [playerController.view setFrame: self.bounds];
    [self addSubview: playerController.view];
    
    [self updateProps];
  }
}

- (void) setAutoplay:(BOOL)autoplay {
  NSLog(@"setAutoplay...autoplay=%d", autoplay);
  _autoplay = autoplay;
  
  [self updateProps];
}

- (void) setSrc: (NSString *)uri {
  NSLog(@"setSrc...src=%@", uri);
  _src = uri;
  
  if(playerController) {
    [playerController stop];
    playerController.contentURL = nil;
  }
  [self updateProps];
}

- (void) setPreload:(NSString *)preload {
  NSLog(@"setPreload...preload=%@", preload);
  _preload = preload;
  
  [self updateProps];
}

- (void) setLoop:(BOOL)loop {
  NSLog(@"setLoop...loop=%d", loop);
  _loop = loop;
  
  [self updateProps];
}

- (void) updateProps {
  if(!playerController)
    return;
  if(self.loop) {
    playerController.repeatMode = MPMovieRepeatModeOne;
  } else {
    playerController.repeatMode = MPMovieRepeatModeNone;
  }
  
  if(!self.src) {
    return;
  }
  
  if(playerController.contentURL && playerController.isPreparedToPlay) {
    return;
  }
  
  //autoplay and preload options are only effective before a video is played
  if(self.autoplay) {
    playerController.shouldAutoplay = YES;
    playerController.contentURL = [NSURL URLWithString:self.src];
    [playerController prepareToPlay];
  } else {
    playerController.shouldAutoplay = NO;
    if(self.preload) {
      if([self.preload isEqualToString:@"none"]) {
        playerController.contentURL = nil;
      } else if([self.preload isEqualToString:@"metadata"]) {
        playerController.contentURL = [NSURL URLWithString:self.src];
      } else if([self.preload isEqualToString:@"auto"]) {
        playerController.contentURL = [NSURL URLWithString:self.src];
        [playerController prepareToPlay];
      }
    }
  }
}

- (void) layoutSubviews {
  NSLog(@"layoutSubviews...");
  [super layoutSubviews];
  [self initPlayerControllerIfNeeded];
}

- (void)onMPMoviePlayerNotification: (NSNotification *) notification {
  NSLog(@"onMPMoviePlayerNotification...name=%@", notification.name);
  if ([notification.name isEqualToString:MPMoviePlayerPlaybackStateDidChangeNotification]) {
    MPMoviePlaybackState playState = playerController.playbackState;
    NSLog(@"playState=%@", [self descPlayState:playState]);
    if (playState == MPMoviePlaybackStatePlaying) {
      [self startProgressTimer];
      if (self.onPlayerPlaying) {
        self.onPlayerPlaying(nil);
      }
    } else if(playState == MPMoviePlaybackStateStopped || playState == MPMoviePlaybackStatePaused || playState == MPMoviePlaybackStateInterrupted){
      [self stopProgressTimer];
      if(playState == MPMoviePlaybackStatePaused) {
        if (self.onPlayerPaused) {
          self.onPlayerPaused(nil);
        }
      }
    }
  } else if ([notification.name isEqualToString:MPMoviePlayerLoadStateDidChangeNotification]) {
    MPMovieLoadState loadState = playerController.loadState;
    NSLog(@"loadState=%@", [self descLoadState:loadState]);
    if ((loadState & MPMovieLoadStateStalled) == MPMovieLoadStateStalled) {
      if(self.onPlayerBuffering) {
        self.onPlayerBuffering(nil);
      }
    } else {
      if(self.onPlayerBufferOK) {
        self.onPlayerBufferOK(nil);
      }
    }
  } else if([notification.name isEqualToString:MPMovieDurationAvailableNotification]) {
    [self onProgress];
  } else if([notification.name isEqualToString:MPMoviePlayerPlaybackDidFinishNotification]) {
    if (self.onPlayerFinished) {
      self.onPlayerFinished(nil);
    }
  }
}

// for debug info
- (NSString *)descPlayState: (MPMoviePlaybackState) state {
  switch (state) {
    case MPMoviePlaybackStateStopped:
      return @"stopped";
    case MPMoviePlaybackStatePaused:
      return @"paused";
    case MPMoviePlaybackStatePlaying:
      return @"playing";
    case MPMoviePlaybackStateInterrupted:
      return @"interrupted";
    case MPMoviePlaybackStateSeekingForward:
      return @"seekingForward";
    case MPMoviePlaybackStateSeekingBackward:
      return @"seekingBackward";
    default:
      return @"error";
  }
}

// for debug info
- (NSString *)descLoadState: (MPMovieLoadState) state {
  if ((state & MPMovieLoadStateStalled) == MPMovieLoadStateStalled) {
    return @"stalled";
  } else if ((state & MPMovieLoadStatePlaythroughOK) == MPMovieLoadStatePlaythroughOK) {
    return @"playthroughOK";
  } else if((state & MPMovieLoadStatePlayable) == MPMovieLoadStatePlayable) {
    return @"playable";
  } else {
    return @"unknown";
  }
}

- (void)startProgressTimer {
  if (self.progressTimer) {
    [self.progressTimer invalidate];
  }
  self.progressTimer = [NSTimer scheduledTimerWithTimeInterval:0.5 target:self selector:@selector(onProgress) userInfo:nil repeats:YES];
  [[NSRunLoop currentRunLoop] addTimer:self.progressTimer forMode:NSDefaultRunLoopMode];
}

- (void)stopProgressTimer {
  [self.progressTimer invalidate];
}

- (void)onProgress {
  double currentTime = floor(playerController.currentPlaybackTime);
  if (isnan(currentTime)) {
    currentTime = 0;
  }
  double totalTime = floor(playerController.duration);
  if (isnan(totalTime)) {
    totalTime = 0;
  }
  
  if(lastCurrent != currentTime || lastTotal != totalTime) {
    lastCurrent = currentTime;
    lastTotal = totalTime;
    if (self.onPlayerProgress) {
      self.onPlayerProgress(@{@"current": @(currentTime * 1000), @"total": @(totalTime * 1000)});
    }
  }
}

- (void)pause {
  NSLog(@"pause...");
  if(!playerController)
    return;
  [playerController pause];
}

- (void)play {
  NSLog(@"play...");
  if(!playerController)
    return;
  if(!playerController.contentURL && self.src) {
    NSLog(@"play...assign src=%@", self.src);
    playerController.contentURL = [NSURL URLWithString:self.src];
  }
  playerController.shouldAutoplay = YES;
  [playerController play];
}

- (void)stop {
  NSLog(@"stop...");
  if(!playerController)
    return;
  [playerController stop];
}

- (void)seekTo: (NSTimeInterval) timeMs {
  NSLog(@"seekTo...timeMs=%f", timeMs);
  if(!playerController)
    return;
  [playerController setCurrentPlaybackTime:timeMs/1000];
}
@end
