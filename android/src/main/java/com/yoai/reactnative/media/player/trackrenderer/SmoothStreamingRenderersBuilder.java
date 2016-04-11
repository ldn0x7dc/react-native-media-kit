package com.yoai.reactnative.media.player.trackrenderer;

import android.content.Context;
import android.media.AudioManager;
import android.media.MediaCodec;
import android.os.Handler;
import android.os.Looper;

import com.google.android.exoplayer.DefaultLoadControl;
import com.google.android.exoplayer.LoadControl;
import com.google.android.exoplayer.MediaCodecAudioTrackRenderer;
import com.google.android.exoplayer.MediaCodecSelector;
import com.google.android.exoplayer.MediaCodecVideoTrackRenderer;
import com.google.android.exoplayer.TrackRenderer;
import com.google.android.exoplayer.audio.AudioCapabilities;
import com.google.android.exoplayer.chunk.ChunkSampleSource;
import com.google.android.exoplayer.chunk.ChunkSource;
import com.google.android.exoplayer.chunk.FormatEvaluator;
import com.google.android.exoplayer.drm.DrmSessionManager;
import com.google.android.exoplayer.drm.MediaDrmCallback;
import com.google.android.exoplayer.drm.StreamingDrmSessionManager;
import com.google.android.exoplayer.drm.UnsupportedDrmException;
import com.google.android.exoplayer.smoothstreaming.DefaultSmoothStreamingTrackSelector;
import com.google.android.exoplayer.smoothstreaming.SmoothStreamingChunkSource;
import com.google.android.exoplayer.smoothstreaming.SmoothStreamingManifest;
import com.google.android.exoplayer.smoothstreaming.SmoothStreamingManifestParser;
import com.google.android.exoplayer.text.TextRenderer;
import com.google.android.exoplayer.text.TextTrackRenderer;
import com.google.android.exoplayer.upstream.BandwidthMeter;
import com.google.android.exoplayer.upstream.DataSource;
import com.google.android.exoplayer.upstream.DefaultAllocator;
import com.google.android.exoplayer.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer.upstream.DefaultHttpDataSource;
import com.google.android.exoplayer.upstream.DefaultUriDataSource;
import com.google.android.exoplayer.util.ManifestFetcher;
import com.google.android.exoplayer.util.Util;
import com.yoai.reactnative.media.player.TrackRenderersBuilder;

import java.io.IOException;

public class SmoothStreamingRenderersBuilder implements TrackRenderersBuilder, ManifestFetcher.ManifestCallback<SmoothStreamingManifest> {

  private static final int BUFFER_SEGMENT_SIZE = 64 * 1024;
  private static final int VIDEO_BUFFER_SEGMENTS = 200;
  private static final int AUDIO_BUFFER_SEGMENTS = 54;
  private static final int TEXT_BUFFER_SEGMENTS = 2;
  private static final int LIVE_EDGE_LATENCY_MS = 30000;

  private final Context context;
  private final String userAgent;
  private final String url;
  private final Handler eventHandler;
  private final MediaDrmCallback drmCallback;
  private final MediaCodecVideoTrackRenderer.EventListener videoTrackListener;
  private final MediaCodecAudioTrackRenderer.EventListener audioTrackListener;
  private final TextRenderer textRenderer;
  private final BandwidthMeter.EventListener bandwidthMeterListener;
  private final Looper playbackLooper;

  private Callback callback;
  private ManifestFetcher<SmoothStreamingManifest> manifestFetcher;

  private volatile boolean cancelled = false;

  public SmoothStreamingRenderersBuilder(Context context, String userAgent, String url, Handler eventHandler, MediaDrmCallback drmCallback, MediaCodecVideoTrackRenderer.EventListener videoTrackListener, MediaCodecAudioTrackRenderer.EventListener audioTrackListener, TextRenderer textRenderer, BandwidthMeter.EventListener bandwidthMeterListener, Looper playbackLooper) {
    this.context = context;
    this.userAgent = userAgent;
    this.eventHandler = eventHandler;
    this.videoTrackListener = videoTrackListener;
    this.audioTrackListener = audioTrackListener;
    this.textRenderer = textRenderer;
    this.bandwidthMeterListener = bandwidthMeterListener;
    this.playbackLooper = playbackLooper;
    this.manifestFetcher = manifestFetcher;
    this.url = Util.toLowerInvariant(url).endsWith("/manifest") ? url : url + "/Manifest";
    this.drmCallback = drmCallback;
  }

  @Override
  public void build(Callback callback) {
    this.callback = callback;
    SmoothStreamingManifestParser parser = new SmoothStreamingManifestParser();
    manifestFetcher = new ManifestFetcher<>(url, new DefaultHttpDataSource(userAgent, null),
      parser);
    manifestFetcher.singleLoad(eventHandler.getLooper(), this);
  }

  @Override
  public void cancel() {
    cancelled = true;
  }

  @Override
  public void onSingleManifest(SmoothStreamingManifest manifest) {
    if (cancelled) {
      return;
    }

    LoadControl loadControl = new DefaultLoadControl(new DefaultAllocator(BUFFER_SEGMENT_SIZE));
    DefaultBandwidthMeter bandwidthMeter = new DefaultBandwidthMeter(eventHandler, bandwidthMeterListener);

    // Check drm support if necessary.
    DrmSessionManager drmSessionManager = null;
    if (manifest.protectionElement != null) {
      if (Util.SDK_INT < 18) {
        callback.onError(new UnsupportedDrmException(UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME));
        return;
      }
      try {
        drmSessionManager = new StreamingDrmSessionManager(manifest.protectionElement.uuid,
          playbackLooper, drmCallback, null, eventHandler, new StreamingDrmSessionManager.EventListener() {
          @Override
          public void onDrmKeysLoaded() {
          }

          @Override
          public void onDrmSessionManagerError(final Exception e) {
            if (cancelled) {
              return;
            }
            callback.onError(e);
          }
        });
      } catch (UnsupportedDrmException e) {
        if (!cancelled) {
          callback.onError(e);
        }
        return;
      }
    }

    // Build the video renderer.
    DataSource videoDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ChunkSource videoChunkSource = new SmoothStreamingChunkSource(manifestFetcher,
      DefaultSmoothStreamingTrackSelector.newVideoInstance(context, true, false),
      videoDataSource, new FormatEvaluator.AdaptiveEvaluator(bandwidthMeter), LIVE_EDGE_LATENCY_MS);
    ChunkSampleSource videoSampleSource = new ChunkSampleSource(videoChunkSource, loadControl,
      VIDEO_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null,
      TRACK_VIDEO_INDEX);
    TrackRenderer videoTrackRenderer = new MediaCodecVideoTrackRenderer(context, videoSampleSource,
      MediaCodecSelector.DEFAULT, MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT, 5000,
      drmSessionManager, true, eventHandler, videoTrackListener, 50);

    // Build the audio renderer.
    DataSource audioDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ChunkSource audioChunkSource = new SmoothStreamingChunkSource(manifestFetcher,
      DefaultSmoothStreamingTrackSelector.newAudioInstance(),
      audioDataSource, null, LIVE_EDGE_LATENCY_MS);
    ChunkSampleSource audioSampleSource = new ChunkSampleSource(audioChunkSource, loadControl,
      AUDIO_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null,
      TRACK_AUDIO_INDEX);
    TrackRenderer audioTrackRenderer = new MediaCodecAudioTrackRenderer(audioSampleSource,
      MediaCodecSelector.DEFAULT, drmSessionManager, true, eventHandler, audioTrackListener,
      AudioCapabilities.getCapabilities(context), AudioManager.STREAM_MUSIC);

    // Build the text renderer.
    DataSource textDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ChunkSource textChunkSource = new SmoothStreamingChunkSource(manifestFetcher,
      DefaultSmoothStreamingTrackSelector.newTextInstance(),
      textDataSource, null, LIVE_EDGE_LATENCY_MS);
    ChunkSampleSource textSampleSource = new ChunkSampleSource(textChunkSource, loadControl,
      TEXT_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null,
      TRACK_TEXT_INDEX);
    TrackRenderer textTrackRenderer = new TextTrackRenderer(textSampleSource, textRenderer,
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
  public void onSingleManifestError(final IOException e) {
    if (cancelled) {
      return;
    }

    eventHandler.post(new Runnable() {
      @Override
      public void run() {
        callback.onError(e);
      }
    });
  }
}
