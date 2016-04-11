package com.yoai.reactnative.media.player;

import android.content.Context;
import android.util.Log;
import android.view.Gravity;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactContext;
import com.google.android.exoplayer.ExoPlayer;

public class ReactMediaPlayerView extends FrameLayout implements LifecycleEventListener {
  private static final String TAG = "ReactMediaPlayerView";

  private final Runnable measureAndLayout = new Runnable() {
    @Override
    public void run() {
      Log.d(TAG, "measure...w=" + getWidth() + ", h=" + getHeight());
      measure(
        MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
        MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));

      Log.d(TAG, "layout...l=" + getLeft() + ", t=" + getTop() + ", r=" + getRight() + ", b=" + getBottom());
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };

  private MediaPlayerController playerController;
  private String uri;

  private MediaPlayerListener mediaPlayerListener;

  public ReactMediaPlayerView(Context context) {
    super(context);

    setBackgroundColor(0xff000000);
    playerController = new MediaPlayerController(context);
    addView(playerController.getView(), new LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT, Gravity.CENTER));

    playerController.addEventListener(new MediaPlayerController.BaseEventListener() {

      @Override
      public void onVideoSizeChanged(int width, int height, int unappliedRotationDegrees, float pixelWidthHeightRatio) {
        measureAndLayout.run();
      }

      @Override
      public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
        Log.d(TAG, "onPlayerStateChanged...playWhenReady=" + playWhenReady + ", state=" + descPlaybackState(playbackState));
        if (mediaPlayerListener != null) {
          switch (playbackState) {
            case ExoPlayer.STATE_BUFFERING:
              if(!playWhenReady) {
                mediaPlayerListener.onPlayerPaused();
              }
            case ExoPlayer.STATE_PREPARING:
              mediaPlayerListener.onPlayerBuffering();
              break;
            case ExoPlayer.STATE_ENDED:
              mediaPlayerListener.onPlayerFinished();
              break;
            case ExoPlayer.STATE_IDLE:
              break;
            case ExoPlayer.STATE_READY:
              mediaPlayerListener.onPlayerBufferReady();
              if (playWhenReady) {
                mediaPlayerListener.onPlayerPlaying();
              } else {
                mediaPlayerListener.onPlayerPaused();
              }
              break;
            default:
              break;
          }
        }

        if (playbackState == ExoPlayer.STATE_READY && playerController.getExoPlayer().getPlayWhenReady()) {
          startProgressTimer();
        } else {
          stopProgressTimer();
        }
      }
    });
  }

  public MediaPlayerController getMediaPlayerController() {
    return playerController;
  }

  private String descPlaybackState(int state) {
    switch (state) {
      case ExoPlayer.STATE_BUFFERING:
        return "buffering";
      case ExoPlayer.STATE_PREPARING:
        return "preparing";
      case ExoPlayer.STATE_ENDED:
        return "ended";
      case ExoPlayer.STATE_IDLE:
        return "idle";
      case ExoPlayer.STATE_READY:
        return "ready";
      default:
        return "unknown";
    }
  }

  public void setUri(String uri) {
    this.uri = uri;
    playerController.setContentUri(uri);
  }

  @Override
  protected void onAttachedToWindow() {
    Log.d(TAG, "onAttachedToWindow...");
    super.onAttachedToWindow();
    if (getContext() instanceof ReactContext) {
      ((ReactContext) getContext()).addLifecycleEventListener(this);
    }
    playerController.prepareSurface();
  }

  @Override
  protected void onDetachedFromWindow() {
    Log.d(TAG, "onDetachedFromWindow...");
    super.onDetachedFromWindow();
    if (getContext() instanceof ReactContext) {
      ((ReactContext) getContext()).removeLifecycleEventListener(this);
    }
  }

  @Override
  public void onHostResume() {
    Log.d(TAG, "onHostResume...");
    playerController.prepareSurface();
    playerController.play();
  }

  @Override
  public void onHostPause() {
    Log.d(TAG, "onHostPause...");
    playerController.pause();
  }

  @Override
  public void onHostDestroy() {
    Log.d(TAG, "onHostDestroy...");
    //TODO
  }

  private Runnable onProgress = new Runnable() {
    @Override
    public void run() {
      long current = playerController.getExoPlayer().getCurrentPosition();
      long total = playerController.getExoPlayer().getDuration();
      Log.d(TAG, "onProgress..." + current + "/" + total);
      if (mediaPlayerListener != null) {
        mediaPlayerListener.onPlayerProgress(current, total);
      }
      postDelayed(onProgress, 500);
    }
  };

  private void startProgressTimer() {
    post(onProgress);
  }

  private void stopProgressTimer() {
    removeCallbacks(onProgress);
  }

  public interface MediaPlayerListener {

    void onPlayerPlaying();

    void onPlayerPaused();

    void onPlayerFinished();

    void onPlayerBuffering();

    void onPlayerBufferReady();

    void onPlayerProgress(long current, long total);
  }

  public void setMediaPlayerListener(MediaPlayerListener listener) {
    this.mediaPlayerListener = listener;
  }
}
