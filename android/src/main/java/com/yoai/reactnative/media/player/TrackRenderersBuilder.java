package com.yoai.reactnative.media.player;

import com.google.android.exoplayer.TrackRenderer;

public interface TrackRenderersBuilder {

  int TRACK_RENDER_COUNT = 4;
  int TRACK_VIDEO_INDEX = 0;
  int TRACK_AUDIO_INDEX = 1;
  int TRACK_TEXT_INDEX = 2;
  int TRACK_METADATA_INDEX = 3;

  void build(Callback callback);

  void cancel();

  interface Callback {
    void onFinish(TrackRenderer[] trackRenderers);

    void onError(Exception e);
  }
}
