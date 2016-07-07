package com.greatdroid.reactnative.media.player.trackrenderer;

import android.content.Context;
import android.media.AudioManager;
import android.media.MediaCodec;
import android.net.Uri;
import android.os.Handler;

import com.google.android.exoplayer.MediaCodecAudioTrackRenderer;
import com.google.android.exoplayer.MediaCodecSelector;
import com.google.android.exoplayer.MediaCodecVideoTrackRenderer;
import com.google.android.exoplayer.TrackRenderer;
import com.google.android.exoplayer.audio.AudioCapabilities;
import com.google.android.exoplayer.extractor.ExtractorSampleSource;
import com.google.android.exoplayer.text.TextRenderer;
import com.google.android.exoplayer.text.TextTrackRenderer;
import com.google.android.exoplayer.upstream.Allocator;
import com.google.android.exoplayer.upstream.BandwidthMeter;
import com.google.android.exoplayer.upstream.DataSource;
import com.google.android.exoplayer.upstream.DefaultAllocator;
import com.google.android.exoplayer.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer.upstream.DefaultUriDataSource;
import com.greatdroid.reactnative.media.player.TrackRenderersBuilder;

public class ExtractorRenderersBuilder implements TrackRenderersBuilder {

  private static final int BUFFER_SEGMENT_SIZE = 64 * 1024;
  private static final int BUFFER_SEGMENT_COUNT = 256;

  private final Context context;
  private final String userAgent;
  private final Uri uri;
  private final Handler eventHandler;
  private final MediaCodecVideoTrackRenderer.EventListener videoTrackListener;
  private final MediaCodecAudioTrackRenderer.EventListener audioTrackListener;
  private final TextRenderer textRenderer;
  private final BandwidthMeter.EventListener bandwidthMeterListener;

  public ExtractorRenderersBuilder(Context context, String userAgent, Uri uri, Handler eventHandler, MediaCodecVideoTrackRenderer.EventListener videoTrackListener, MediaCodecAudioTrackRenderer.EventListener audioTrackListener, TextRenderer textRenderer, BandwidthMeter.EventListener bandwidthMeterListener) {
    this.context = context;
    this.userAgent = userAgent;
    this.uri = uri;
    this.eventHandler = eventHandler;
    this.videoTrackListener = videoTrackListener;
    this.audioTrackListener = audioTrackListener;
    this.textRenderer = textRenderer;
    this.bandwidthMeterListener = bandwidthMeterListener;
  }

  @Override
  public void build(final Callback callback) {
    Allocator allocator = new DefaultAllocator(BUFFER_SEGMENT_SIZE);
    DefaultBandwidthMeter bandwidthMeter = new DefaultBandwidthMeter(eventHandler, bandwidthMeterListener);
    DataSource dataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ExtractorSampleSource sampleSource = new ExtractorSampleSource(uri, dataSource, allocator,
      BUFFER_SEGMENT_COUNT * BUFFER_SEGMENT_SIZE);

    MediaCodecVideoTrackRenderer videoTrackRenderer = new MediaCodecVideoTrackRenderer(context,
      sampleSource, MediaCodecSelector.DEFAULT, MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT, 5000,
      eventHandler, videoTrackListener, 50);
    MediaCodecAudioTrackRenderer audioTrackRenderer = new MediaCodecAudioTrackRenderer(sampleSource,
      MediaCodecSelector.DEFAULT, null, true, eventHandler, audioTrackListener,
      AudioCapabilities.getCapabilities(context), AudioManager.STREAM_MUSIC);
    TextTrackRenderer textTrackRenderer = new TextTrackRenderer(sampleSource, textRenderer,
      eventHandler.getLooper());

    final TrackRenderer[] trackRenderers = new TrackRenderer[TRACK_RENDER_COUNT];
    trackRenderers[TRACK_VIDEO_INDEX] = videoTrackRenderer;
    trackRenderers[TRACK_AUDIO_INDEX] = audioTrackRenderer;
    trackRenderers[TRACK_TEXT_INDEX] = textTrackRenderer;
    eventHandler.post(new Runnable() {
      @Override
      public void run() {
        callback.onFinish(trackRenderers);
      }
    });
  }

  @Override
  public void cancel() {
    //do nothing
  }
}
