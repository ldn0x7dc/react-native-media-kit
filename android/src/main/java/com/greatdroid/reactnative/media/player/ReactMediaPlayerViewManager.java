package com.greatdroid.reactnative.media.player;

import android.os.SystemClock;
import android.support.annotation.Nullable;
import android.util.Log;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.Map;

public class ReactMediaPlayerViewManager extends SimpleViewManager<ReactMediaPlayerView> {
  private static final String TAG = "MediaPlayerViewManager";

  public static final String REACT_CLASS = "RCTMediaPlayerView";

  public static final String EVENT_ON_PLAYER_PLAYING = "onPlayerPlaying";
  public static final String EVENT_ON_PLAYER_PAUSED = "onPlayerPaused";
  public static final String EVENT_ON_PLAYER_PROGRESS = "onPlayerProgress";
  public static final String EVENT_ON_PLAYER_BUFFER_CHANGE = "onPlayerBufferChange";
  public static final String EVENT_ON_PLAYER_BUFFERING = "onPlayerBuffering";
  public static final String EVENT_ON_PLAYER_BUFFER_OK = "onPlayerBufferOK";
  public static final String EVENT_ON_PLAYER_FINISHED = "onPlayerFinished";

  public static final int CMD_PLAY = 1;
  public static final int CMD_PAUSE = 2;
  public static final int CMD_SEEK_TO = 3;
  public static final int CMD_STOP = 4;


  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ReactMediaPlayerView createViewInstance(ThemedReactContext reactContext) {
    return new ReactMediaPlayerView(reactContext);
  }

  @ReactProp(name = "src")
  public void setSrc(ReactMediaPlayerView view, @Nullable String uri) {
    if (!uri.startsWith("http")) { 
      uri = "asset:///" + uri; // app/src/main/assets/<filepath>
      }
    Log.d(TAG, "setSrc...src=" + uri);
    view.setUri(uri);
  }

  @ReactProp(name = "preload")
  public void setPreload(ReactMediaPlayerView view, @Nullable String preload) {
    Log.d(TAG, "setPreload...preload=" + preload);
    view.setPreload(preload);
  }

  @ReactProp(name = "autoplay", defaultBoolean = false)
  public void setAutoplay(ReactMediaPlayerView view, boolean autoplay) {
    Log.d(TAG, "setAutoplay...autoplay=" + autoplay);
    view.setAutoplay(autoplay);
  }

  @ReactProp(name = "loop", defaultBoolean = false)
  public void setLoop(ReactMediaPlayerView view, boolean loop) {
    Log.d(TAG, "setLoop...loop=" + loop);
    view.setLoop(loop);
  }

  @ReactProp(name = "muted", defaultBoolean = false)
  public void setMuted(ReactMediaPlayerView view, boolean muted) {
    Log.d(TAG, "setMuted...muted=" + muted);
    view.setMuted(muted);

  }

  ////////////////////////////////

  @Override
  protected void addEventEmitters(final ThemedReactContext reactContext, final ReactMediaPlayerView view) {
    super.addEventEmitters(reactContext, view);

    view.setMediaPlayerListener(new ReactMediaPlayerView.MediaPlayerListener() {

      private long buffered = -1;

      @Override
      public void onPlayerPlaying() {
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new Event(view.getId()) {
                  @Override
                  public String getEventName() {
                    return EVENT_ON_PLAYER_PLAYING;
                  }

                  @Override
                  public void dispatch(RCTEventEmitter rctEventEmitter) {
                    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), null);
                  }
                });
      }

      @Override
      public void onPlayerPaused() {
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new Event(view.getId()) {
                  @Override
                  public String getEventName() {
                    return EVENT_ON_PLAYER_PAUSED;
                  }

                  @Override
                  public void dispatch(RCTEventEmitter rctEventEmitter) {
                    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), null);
                  }
                });
      }

      @Override
      public void onPlayerFinished() {
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new Event(view.getId()) {
                  @Override
                  public String getEventName() {
                    return EVENT_ON_PLAYER_FINISHED;
                  }

                  @Override
                  public void dispatch(RCTEventEmitter rctEventEmitter) {
                    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), null);
                  }
                });
      }

      @Override
      public void onPlayerBuffering() {
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new Event(view.getId()) {
                  @Override
                  public String getEventName() {
                    return EVENT_ON_PLAYER_BUFFERING;
                  }

                  @Override
                  public void dispatch(RCTEventEmitter rctEventEmitter) {
                    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), null);
                  }
                });
      }

      @Override
      public void onPlayerBufferReady() {
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new Event(view.getId()) {
                  @Override
                  public String getEventName() {
                    return EVENT_ON_PLAYER_BUFFER_OK;
                  }

                  @Override
                  public void dispatch(RCTEventEmitter rctEventEmitter) {
                    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), null);
                  }
                });
      }

      @Override
      public void onPlayerProgress(final long current, final long total, final long buffered) {
        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                .dispatchEvent(new Event(view.getId()) {
                  @Override
                  public String getEventName() {
                    return EVENT_ON_PLAYER_PROGRESS;
                  }

                  @Override
                  public void dispatch(RCTEventEmitter rctEventEmitter) {
                    WritableMap map = new WritableNativeMap();
                    map.putInt("current", (int) current);
                    map.putInt("total", (int) total);
                    rctEventEmitter.receiveEvent(getViewTag(), getEventName(), map);
                  }
                });

        if (buffered > 0 && this.buffered != buffered) {
          this.buffered = buffered;
          reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                  .dispatchEvent(new Event(view.getId()) {
                    @Override
                    public String getEventName() {
                      return EVENT_ON_PLAYER_BUFFER_CHANGE;
                    }

                    @Override
                    public void dispatch(RCTEventEmitter rctEventEmitter) {
                      WritableArray array = new WritableNativeArray();
                      WritableMap map = new WritableNativeMap();
                      map.putInt("start", 0);
                      map.putInt("duration", (int) buffered);
                      array.pushMap(map);

                      map = new WritableNativeMap();
                      map.putArray("ranges", array);
                      rctEventEmitter.receiveEvent(getViewTag(), getEventName(), map);
                    }
                  });
        }
      }
    });
  }

  @javax.annotation.Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return MapBuilder.<String, Object>builder()
            .put(EVENT_ON_PLAYER_PLAYING, MapBuilder.of("registrationName", EVENT_ON_PLAYER_PLAYING))
            .put(EVENT_ON_PLAYER_PAUSED, MapBuilder.of("registrationName", EVENT_ON_PLAYER_PAUSED))
            .put(EVENT_ON_PLAYER_PROGRESS, MapBuilder.of("registrationName", EVENT_ON_PLAYER_PROGRESS))
            .put(EVENT_ON_PLAYER_BUFFERING, MapBuilder.of("registrationName", EVENT_ON_PLAYER_BUFFERING))
            .put(EVENT_ON_PLAYER_BUFFER_OK, MapBuilder.of("registrationName", EVENT_ON_PLAYER_BUFFER_OK))
            .put(EVENT_ON_PLAYER_BUFFER_CHANGE, MapBuilder.of("registrationName", EVENT_ON_PLAYER_BUFFER_CHANGE))
            .put(EVENT_ON_PLAYER_FINISHED, MapBuilder.of("registrationName", EVENT_ON_PLAYER_FINISHED))
            .build();
  }

  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
            "play", CMD_PLAY,
            "pause", CMD_PAUSE,
            "seekTo", CMD_SEEK_TO,
            "stop", CMD_STOP);
  }

  @Override
  public void receiveCommand(ReactMediaPlayerView root, int commandId, @Nullable ReadableArray args) {
    super.receiveCommand(root, commandId, args);
    switch (commandId) {
      case CMD_PLAY:
        root.getMediaPlayerController().play();
        break;
      case CMD_PAUSE:
        root.getMediaPlayerController().pause();
        break;
      case CMD_SEEK_TO:
        root.getMediaPlayerController().seekTo((long) args.getDouble(0));
        break;
      case CMD_STOP:
        root.getMediaPlayerController().stop();
        break;
      default:
        break;
    }
  }
}
