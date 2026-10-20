const session = 'a'.repeat(32), owner = 'b'.repeat(32);
function state(extra = {}) {
  return { owner, revision: 1, hasVideo: true, fullscreen: false, paused: false, muted: false,
    width: 1920, height: 1080, rate: 1, requestedRate: 1, volume: 100, requestedVolume: 100, audioMode: 'stereo',
    adapter: 'HlsJsAdapter', forcedAdapter: 'none', drm: false, qualities: [{ height: 1080, bitrate: 5000000 }, { height: 720, bitrate: 2000000 }],
    verification: 'not-verified', requestedHeight: 0, requestedIndex: -1, decodedMatch: null, renditionMatch: null,
    subtitleLoaded: false, subtitleEnabled: true, subtitleStatus: 'not-loaded', subtitleOffset: 0,
    appearance: { fontSize: 20, bottom: 8, background: 82, color: 'white' },
    filters: { brightness: 100, contrast: 100, saturate: 100, nightShield: false, invert: false },
    candidates: [{ height: 1080 }], target: -1, ...extra };
}
function report(extra = {}) {
  return { reportSchemaVersion: 2, extensionVersion: '0.6.1', errorCode: 'USER_MANUAL_DIAGNOSTIC', platform: 'other', platformScope: 'unlisted',
    browserFamily: 'firefox', playerType: 'native-html5', activeAdapter: 'GenericAdapter', adapterTier: 3, forcedAdapter: 'none',
    forcedAdapterStatus: 'not-forced', adapterSelectionStatus: 'healthy', frame: { context: 'iframe', localFrameCount: '0', inaccessibleFrameCount: '0' },
    videoCandidateCount: '1', videoState: { readyState: 4, networkState: 2, hasDecodedDimensions: true, resolutionClass: 'fhd', mediaMode: 'vod', sourceKind: 'blob',
      paused: false, muted: false, requestedPlaybackRate: 1, playbackRateLock: 'off', observedPlaybackRate: 1, requestedVolumePercent: 100,
      observedNativeVolumePercent: 100, observedGain: null, audioContextState: 'not-created', audioSourceCreated: false, audioMode: 'stereo', drmDetected: false,
      isShadowDom: false, subtitleLoaded: false, subtitleLoadStatus: 'not-loaded', subtitleRenderStatus: 'not-loaded' },
    quality: { control: 'not-implemented', requestedHeight: null, cachedOptionCount: '0', verification: 'not-verified', decodedMatch: null, renditionMatch: null,
      inventoryScope: 'adapter', inventoryCompleteness: 'not-verified', adaptiveMode: 'unknown', playerLevelCount: null, knownResolutionCount: null,
      manifestObserved: false, declaredLevelCount: null }, cdnMeasurementStatus: 'not-tested', recentEvents: [], problem: 'unspecified', ...extra };
}
module.exports = { state, report, session, owner };
