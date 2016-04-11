package com.yoai.reactnative.media.player.trackrenderer;

import android.content.Context;
import android.media.AudioManager;
import android.media.MediaCodec;
import android.os.Handler;

import com.google.android.exoplayer.DefaultLoadControl;
import com.google.android.exoplayer.LoadControl;
import com.google.android.exoplayer.MediaCodecAudioTrackRenderer;
import com.google.android.exoplayer.MediaCodecSelector;
import com.google.android.exoplayer.MediaCodecVideoTrackRenderer;
import com.google.android.exoplayer.TrackRenderer;
import com.google.android.exoplayer.audio.AudioCapabilities;
import com.google.android.exoplayer.hls.DefaultHlsTrackSelector;
import com.google.android.exoplayer.hls.HlsChunkSource;
import com.google.android.exoplayer.hls.HlsMasterPlaylist;
import com.google.android.exoplayer.hls.HlsPlaylist;
import com.google.android.exoplayer.hls.HlsPlaylistParser;
import com.google.android.exoplayer.hls.HlsSampleSource;
import com.google.android.exoplayer.hls.PtsTimestampAdjusterProvider;
import com.google.android.exoplayer.metadata.MetadataTrackRenderer;
import com.google.android.exoplayer.metadata.id3.Id3Frame;
import com.google.android.exoplayer.metadata.id3.Id3Parser;
import com.google.android.exoplayer.text.TextRenderer;
import com.google.android.exoplayer.text.TextTrackRenderer;
import com.google.android.exoplayer.text.eia608.Eia608TrackRenderer;
import com.google.android.exoplayer.upstream.BandwidthMeter;
import com.google.android.exoplayer.upstream.DataSource;
import com.google.android.exoplayer.upstream.DefaultAllocator;
import com.google.android.exoplayer.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer.upstream.DefaultUriDataSource;
import com.google.android.exoplayer.util.ManifestFetcher;
import com.yoai.reactnative.media.player.TrackRenderersBuilder;

import java.io.IOException;
import java.util.List;

public class HlsRenderersBuilder implements TrackRenderersBuilder, ManifestFetcher.ManifestCallback<HlsPlaylist> {

  private static final int BUFFER_SEGMENT_SIZE = 64 * 1024;
  private static final int MAIN_BUFFER_SEGMENTS = 256;
  private static final int TEXT_BUFFER_SEGMENTS = 2;

  private final Context context;
  private final String userAgent;
  private final String url;
  private final Handler eventHandler;
  private final MediaCodecVideoTrackRenderer.EventListener videoTrackListener;
  private final MediaCodecAudioTrackRenderer.EventListener audioTrackListener;
  private final TextRenderer textRenderer;
  private final MetadataTrackRenderer.MetadataRenderer<List<Id3Frame>> metadataRenderer;
  private final BandwidthMeter.EventListener bandwidthMeterListener;

  private Callback callback;
  private ManifestFetcher<HlsPlaylist> manifestFetcher;

  private volatile boolean cancelled = false;

  public HlsRenderersBuilder(Context context, String userAgent, String url, Handler eventHandler, MediaCodecVideoTrackRenderer.EventListener videoTrackListener, MediaCodecAudioTrackRenderer.EventListener audioTrackListener, TextRenderer textRenderer, MetadataTrackRenderer.MetadataRenderer<List<Id3Frame>> metadataRenderer, BandwidthMeter.EventListener bandwidthMeterListener) {
    this.context = context;
    this.userAgent = userAgent;
    this.url = url;
    this.eventHandler = eventHandler;
    this.videoTrackListener = videoTrackListener;
    this.audioTrackListener = audioTrackListener;
    this.textRenderer = textRenderer;
    this.metadataRenderer = metadataRenderer;
    this.bandwidthMeterListener = bandwidthMeterListener;
  }

  @Override
  public void build(Callback callback) {
    this.callback = callback;
    HlsPlaylistParser hlsPlaylistParser = new HlsPlaylistParser();
    manifestFetcher = new ManifestFetcher<HlsPlaylist>(url, new DefaultUriDataSource(context, userAgent), hlsPlaylistParser);
    manifestFetcher.singleLoad(eventHandler.getLooper(), this);
  }

  @Override
  public void cancel() {
    cancelled = true;
  }

  @Override
  public void onSingleManifest(HlsPlaylist manifest) {
    if(cancelled) {
      return;
    }

    LoadControl loadControl = new DefaultLoadControl(new DefaultAllocator(BUFFER_SEGMENT_SIZE));
    DefaultBandwidthMeter bandwidthMeter = new DefaultBandwidthMeter();
    PtsTimestampAdjusterProvider timestampAdjusterProvider = new PtsTimestampAdjusterProvider();

    DataSource dataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
    HlsChunkSource chunkSource = new HlsChunkSource(true, dataSource, url,
      manifest, DefaultHlsTrackSelector.newDefaultInstance(context), bandwidthMeter,
      timestampAdjusterProvider, HlsChunkSource.ADAPTIVE_MODE_SPLICE);
    HlsSampleSource sampleSource = new HlsSampleSource(chunkSource, loadControl,
      MAIN_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null, TRACK_VIDEO_INDEX);

    MediaCodecVideoTrackRenderer videoTrackRenderer = new MediaCodecVideoTrackRenderer(context,
      sampleSource, MediaCodecSelector.DEFAULT, MediaCodec.VIDEO_SCALING_MODE_SCALE_TO_FIT,
      5000, eventHandler, videoTrackListener, 50);

    MediaCodecAudioTrackRenderer audioTrackRenderer = new MediaCodecAudioTrackRenderer(sampleSource,
      MediaCodecSelector.DEFAULT, null, true, eventHandler, audioTrackListener,
      AudioCapabilities.getCapabilities(context), AudioManager.STREAM_MUSIC);

    MetadataTrackRenderer<List<Id3Frame>> metadataTrackRenderer = new MetadataTrackRenderer<>(
      sampleSource, new Id3Parser(), metadataRenderer, eventHandler.getLooper());

    // Build the text renderer, preferring Webvtt where available.
    boolean preferWebvtt = false;
    if (manifest instanceof HlsMasterPlaylist) {
      preferWebvtt = !((HlsMasterPlaylist) manifest).subtitles.isEmpty();
    }
    TrackRenderer textTrackRenderer;
    if (preferWebvtt) {
      DataSource textDataSource = new DefaultUriDataSource(context, bandwidthMeter, userAgent);
      HlsChunkSource textChunkSource = new HlsChunkSource(false, textDataSource,
        url, manifest, DefaultHlsTrackSelector.newVttInstance(), bandwidthMeter,
        timestampAdjusterProvider, HlsChunkSource.ADAPTIVE_MODE_SPLICE);
      HlsSampleSource textSampleSource = new HlsSampleSource(textChunkSource, loadControl,
        TEXT_BUFFER_SEGMENTS * BUFFER_SEGMENT_SIZE, eventHandler, null, TRACK_TEXT_INDEX);
      textTrackRenderer = new TextTrackRenderer(textSampleSource, textRenderer, eventHandler.getLooper());
    } else {
      textTrackRenderer = new Eia608TrackRenderer(sampleSource, textRenderer, eventHandler.getLooper());
    }

    final TrackRenderer[] trackRenderers = new TrackRenderer[TRACK_RENDER_COUNT];
    trackRenderers[TRACK_VIDEO_INDEX] = videoTrackRenderer;
    trackRenderers[TRACK_AUDIO_INDEX] = audioTrackRenderer;
    trackRenderers[TRACK_TEXT_INDEX] = textTrackRenderer;
    trackRenderers[TRACK_METADATA_INDEX] = metadataTrackRenderer;
    eventHandler.post(new Runnable() {
      @Override
      public void run() {
        callback.onFinish(trackRenderers);
      }
    });
  }

  @Override
  public void onSingleManifestError(final IOException e) {
    if(cancelled) {
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
