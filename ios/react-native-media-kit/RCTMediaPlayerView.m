#import "RCTMediaPlayerView.h"
@import MediaPlayer;

@interface RCTMediaPlayerView ()

@property (nonatomic, strong) MPMoviePlayerController *playerController;

@property (nonatomic, strong) NSTimer *progressTimer;

@end

@implementation RCTMediaPlayerView {
@private
  double lastCurrent;
  double lastTotal;
}

- (instancetype) init {
  self = [super init];
  if (self) {
    self.backgroundColor = [UIColor redColor];
    lastCurrent = -1;
    lastTotal = -1;
  }
  return self;
}

- (void)dealloc{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)bindController {
  [self.playerController.view setFrame: self.bounds];
  [self addSubview:self.playerController.view];
}

- (void) setAutoplay:(BOOL)autoplay {
  NSLog(@"setAutoplay...autoplay=%d", autoplay);
}

- (void) setUri: (NSString *)uri {
  NSLog(@"setUri...uri=%@", uri);
  NSURL *url = [NSURL URLWithString:uri];
  [self.playerController stop];
  self.playerController.contentURL = url;
  [self.playerController play];
}


- (MPMoviePlayerController *) playerController {
  if (!_playerController) {
    _playerController = [[MPMoviePlayerController alloc] init];
    _playerController.controlStyle = MPMovieControlStyleNone;
    _playerController.shouldAutoplay = YES;
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMoviePlayerPlaybackDidFinishNotification object:_playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMoviePlayerLoadStateDidChangeNotification object:_playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMovieDurationAvailableNotification object:_playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMovieNaturalSizeAvailableNotification object:_playerController];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onMPMoviePlayerNotification:) name:MPMoviePlayerPlaybackStateDidChangeNotification object:_playerController];
  }
  return _playerController;
}

- (void) layoutSubviews {
  NSLog(@"layoutSubviews...");
  [super layoutSubviews];
  [self bindController];
  
}

- (void)onMPMoviePlayerNotification: (NSNotification *) notification {
  NSLog(@"onMPMoviePlayerNotification...name=%@", notification.name);
  if ([notification.name isEqualToString:MPMoviePlayerPlaybackStateDidChangeNotification]) {
    MPMoviePlaybackState playState = self.playerController.playbackState;
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
    MPMovieLoadState loadState = self.playerController.loadState;
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

- (void)onProgress {
  double currentTime = floor(self.playerController.currentPlaybackTime);
  if (isnan(currentTime)) {
    currentTime = 0;
  }
  double totalTime = floor(self.playerController.duration);
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

- (NSString *)formatProgress: (double)time {
  double minutes = floor(time / 60.0);
  double seconds = floor(fmod(time, 60.0));
  return [NSString stringWithFormat:@"%02.0f:%02.0f", minutes, seconds];
}

- (void)stopProgressTimer {
  [self.progressTimer invalidate];
}

- (void)pause {
  NSLog(@"pause...");
  [self.playerController pause];
}

- (void)play {
  NSLog(@"play...");
  [self.playerController play];
}

- (void)seekTo: (NSTimeInterval) timeMs {
  NSLog(@"seekTo...timeMs=%f", timeMs);
  [self.playerController pause];
  [self.playerController setCurrentPlaybackTime:timeMs/1000];
  [self.playerController play];
}

@end
