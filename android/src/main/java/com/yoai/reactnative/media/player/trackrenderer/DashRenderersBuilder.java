package com.yoai.reactnative.media.player.trackrenderer;

import android.content.Context;
import android.media.AudioManager;
import android.media.MediaCodec;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

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
import com.google.android.exoplayer.dash.DashChunkSource;
import com.google.android.exoplayer.dash.DefaultDashTrackSelector;
import com.google.android.exoplayer.dash.mpd.AdaptationSet;
import com.google.android.exoplayer.dash.mpd.MediaPresentationDescription;
import com.google.android.exoplayer.dash.mpd.MediaPresentationDescriptionParser;
import com.google.android.exoplayer.dash.mpd.Period;
import com.google.android.exoplayer.dash.mpd.UtcTimingElement;
import com.google.android.exoplayer.dash.mpd.UtcTimingElementResolver;
import com.google.android.exoplayer.drm.MediaDrmCallback;
import com.google.android.exoplayer.drm.StreamingDrmSessionManager;
import com.google.android.exoplayer.drm.UnsupportedDrmException;
import com.google.android.exoplayer.text.TextRenderer;
import com.google.android.exoplayer.text.TextTrackRenderer;
import com.google.android.exoplayer.upstream.BandwidthMeter;
import com.google.android.exoplayer.upstream.DataSource;
import com.google.android.exoplayer.upstream.DefaultAllocator;
import com.google.android.exoplayer.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer.upstream.DefaultUriDataSource;
import com.google.android.exoplayer.upstream.UriDataSource;
import com.google.android.exoplayer.util.ManifestFetcher;
import com.yoai.reactnative.media.player.TrackRenderersBuilder;

import java.io.IOException;

public class DashRenderersBuilder implements TrackRenderersBuilder, UtcTimingElementResolver.UtcTimingCallback, ManifestFetcher.ManifestCallback<MediaPresentationDescription> {
  private static final String TAG = "DashRenderersBuilder";

  private static final int BUFFER_SEGMENT_SIZE = 64 * 1024;
  private static final int VIDEO_BUFFER_SEGMENTS = 200;
  private static final int AUDIO_BUFFER_SEGMENTS = 54;
  private static final int TEXT_BUFFER_SEGMENTS = 2;
  private static final int LIVE_EDGE_LATENCY_MS = 30000;

  private static final int SECURITY_LEVEL_UNKNOWN = -1;
  private static final int SECURITY_LEVEL_1 = 1;
  private static final int SECURITY_LEVEL_3 = 3;

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

  private volatile boolean cancelled = false;

  private Callback callback;
  private UriDataSource uriDataSource;
  ManifestFetcher<MediaPresentationDescription> manifestFetcher;
  private MediaPresentationDescription mpd;
  private long elapsedRealtimeOffset;

  public DashRenderersBuilder(Context context, String userAgent, String url, Handler eventHandler, MediaDrmCallback drmCallback, MediaCodecVideoTrackRenderer.EventListener videoTrackListener, MediaCodecAudioTrackRenderer.EventListener audioTrackListener, TextRenderer textRenderer, BandwidthMeter.EventListener bandwidthMeterListener, Looper playbackLooper) {
    this.context = context;
    this.userAgent = userAgent;
    this.url = url;
    this.eventHandler = eventHandler;
    this.drmCallback = drmCallback;
    this.videoTrackListener = videoTrackListener;
    this.audioTrackListener = audioTrackListener;
    this.textRenderer = textRenderer;
    this.bandwidthMeterListener = bandwidthMeterListener;
    this.playbackLooper = playbackLooper;
  }


  @Override
  public void build(Callback callback) {
    this.callback = callback;
    this.uriDataSource = new DefaultUriDataSource(context, userAgent);
    this.manifestFetcher = new ManifestFetcher<>(url, uriDataSource, new MediaPresentationDescriptionParser());
    this.manifestFetcher.singleLoad(eventHandler.getLooper(), this);
  }

  @Override
  public void cancel() {
    cancelled = true;
  }


  @Override
  public void onTimestampResolved(UtcTimingElement utcTiming, long elapsedRealtimeOffset) {
    if (cancelled) {
      return;
    }
    this.elapsedRealtimeOffset = elapsedRealtimeOffset;
    build();
  }

  @Override
  public void onTimestampError(UtcTimingElement utcTiming, IOException e) {
    if (cancelled) {
      return;
    }
    Log.e(TAG, "onTimestampError...failed to resolve UtcTiming", e);

    // Be optimistic and continue in the hope that the device clock is correct.
    build();
  }


  @Override
  public void onSingleManifest(MediaPresentationDescription manifest) {
    if (cancelled) {
      return;
    }
    mpd = manifest;
    if (mpd.dynamic && mpd.utcTiming != null) {
      UtcTimingElementResolver.resolveTimingElement(uriDataSource, mpd.utcTiming, manifestFetcher.getManifestLoadCompleteTimestamp(), this);
    } else {
      build();
    }
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

  private void build() {
    Period period = mpd.getPeriod(0);
    LoadControl loadControl = new DefaultLoadControl(new DefaultAllocator(BUFFER_SEGMENT_SIZE));
    DefaultBandwidthMeter bandwidthMeter = new DefaultBandwidthMeter(eventHandler, bandwidthMeterListener);

    boolean hasContentProtection = false;
    for (int i = 0; i < period.adaptationSets.size(); i++) {
      AdaptationSet adaptationSet = period.adaptationSets.get(i);
      if (adaptationSet.type != AdaptationSet.TYPE_UNKNOWN) {
        hasContentProtection |= adaptationSet.hasContentProtection();
      }
    }

    // Check drm support if necessary.
    boolean filterHdContent = false;
    StreamingDrmSessionManager drmSessionManager = null;
    if (hasContentProtection) {
      if (Build.VERSION.SDK_INT < 18) {
        callback.onError(new UnsupportedDrmException(UnsupportedDrmException.REASON_UNSUPPORTED_SCHEME));
        return;
      }
      try {
        drmSessionManager = StreamingDrmSessionManager.newWidevineInstance(playbackLooper, drmCallback, null, eventHandler, new StreamingDrmSessionManager.EventListener() {
          @Override
          public void onDrmKeysLoaded() {

          }

          @Override
          public void onDrmSessionManagerError(Exception e) {
            if (cancelled) {
              return;
            }
            callback.onError(e);
          }
        });
        filterHdContent = getWidevineSecurityLevel(drmSessionManager) != SECURITY_LEVEL_1;
      } catch (final UnsupportedDrmException e) {
        if (!cancelled) {
          callback.onError(e);
        }
        return;
      }
    }

    // Build the video renderer.
    DataSource videoDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ChunkSource videoChunkSource = new DashChunkSource(manifestFetcher,
      DefaultDashTrackSelector.newVideoInstance(context, true, filterHdContent),
      videoDataSource, new FormatEvaluator.AdaptiveEvaluator(bandwidthMeter), LIVE_EDGE_LATENCY_MS,
      elapsedRealtimeOffset, eventHandler, null, TRACK_VIDEO_INDEX);
    ChunkSampleSource videoSampleSource = new ChunkSampleSource(videoChunkSource, loadControl,
      VIDEO_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null,
      TRACK_VIDEO_INDEX);
    TrackRenderer videoTrackRenderer = new MediaCodecVideoTrackRenderer(context, videoSampleSource,
      MediaCodecSelector.DEFAULT, MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT, 5000,
      drmSessionManager, true, eventHandler, videoTrackListener, 50);

    // Build the audio renderer.
    DataSource audioDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ChunkSource audioChunkSource = new DashChunkSource(manifestFetcher,
      DefaultDashTrackSelector.newAudioInstance(), audioDataSource, null, LIVE_EDGE_LATENCY_MS,
      elapsedRealtimeOffset, eventHandler, null, TRACK_AUDIO_INDEX);
    ChunkSampleSource audioSampleSource = new ChunkSampleSource(audioChunkSource, loadControl,
      AUDIO_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null,
      TRACK_AUDIO_INDEX);
    TrackRenderer audioTrackRenderer = new MediaCodecAudioTrackRenderer(audioSampleSource,
      MediaCodecSelector.DEFAULT, drmSessionManager, true, eventHandler, audioTrackListener,
      AudioCapabilities.getCapabilities(context), AudioManager.STREAM_MUSIC);

    // Build the text renderer.
    DataSource textDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    ChunkSource textChunkSource = new DashChunkSource(manifestFetcher,
      DefaultDashTrackSelector.newTextInstance(), textDataSource, null, LIVE_EDGE_LATENCY_MS,
      elapsedRealtimeOffset, eventHandler, null, TRACK_TEXT_INDEX);
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

  private static int getWidevineSecurityLevel(StreamingDrmSessionManager sessionManager) {
    String securityLevelProperty = sessionManager.getPropertyString("securityLevel");
    return securityLevelProperty.equals("L1") ? SECURITY_LEVEL_1 : securityLevelProperty
      .equals("L3") ? SECURITY_LEVEL_3 : SECURITY_LEVEL_UNKNOWN;
  }
}
