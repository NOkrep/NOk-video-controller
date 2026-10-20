/* NOk frame presentation protocol. Pure, bounded, RAM-only values; no DOM/URLs/network. */
(() => {
  if (globalThis.NOkFrameProtocol) return;
  const adapters = Object.freeze(['none', 'unknown', 'KickAdapter', 'TrtAdapter', 'NowTvAdapter', 'PuhuTvAdapter',
    'YouTubeAdapter', 'VideoJsAdapter', 'HlsJsAdapter', 'ShakaPlayerAdapter', 'DashJsAdapter', 'GenericAdapter']);
  const platforms = ['other', 'kick', 'trt', 'now', 'puhu', 'youtube', 'twitch', 'reddit', 'x', 'netflix', 'disney', 'prime', 'tabii', 'gain', 'exxen'];
  const verification = ['not-verified', 'pending', 'confirmed', 'decoded-match', 'rendition-confirmed', 'timed-out', 'rejected'];
  const subtitleStatus = ['not-loaded', 'disabled', 'no-video', 'no-active-cue', 'overlay-requested', 'native-requested', 'video-offscreen'];
  const count = ['0', '1', '2-4', '5+'];
  const bool = value => typeof value === 'boolean' ? value : undefined;
  const num = (min, max, integer = false) => value => typeof value === 'number' && Number.isFinite(value)
    && value >= min && value <= max && (!integer || Number.isInteger(value)) ? value : undefined;
  const choice = values => value => values.includes(value) ? value : undefined;
  const nullable = rule => value => value === null ? null : rule(value);
  const record = (value, spec) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const result = {};
    for (const [key, rule] of Object.entries(spec)) {
      if (!Object.hasOwn(value, key)) return undefined;
      const cleaned = rule(value[key]);
      if (cleaned === undefined) return undefined;
      result[key] = cleaned;
    }
    return result;
  };
  const shape = spec => value => record(value, spec);
  const array = (rule, max) => value => {
    if (!Array.isArray(value) || value.length > max) return undefined;
    const cleaned = value.map(rule);
    return cleaned.some(item => item === undefined) ? undefined : cleaned;
  };
  const revision = num(0, 2147483647, true);
  const appearance = shape({ fontSize: num(12, 48, true), bottom: num(0, 40, true), background: num(0, 100, true), color: choice(['white', 'yellow']) });
  const filters = shape({ brightness: num(50, 150), contrast: num(50, 150), saturate: num(0, 200), nightShield: bool, invert: bool });
  const stateSpec = {
    owner: value => cleanSession(value) || undefined, revision, hasVideo: bool, fullscreen: bool, paused: bool, muted: bool,
    width: num(0, 16384, true), height: num(0, 8640, true), rate: num(0, 16), requestedRate: num(0.25, 3),
    volume: num(0, 100), requestedVolume: num(0, 300), audioMode: choice(['stereo', 'mono']),
    adapter: choice(adapters), forcedAdapter: choice(adapters), drm: bool,
    qualities: array(shape({ height: num(0, 4320), bitrate: num(0, 1000000000) }), 128),
    verification: choice(verification), requestedHeight: num(0, 4320), requestedIndex: num(-1, 127, true),
    decodedMatch: nullable(bool), renditionMatch: nullable(bool),
    subtitleLoaded: bool, subtitleEnabled: bool, subtitleStatus: choice(subtitleStatus), subtitleOffset: num(-3600000, 3600000),
    appearance, filters, candidates: array(shape({ height: num(0, 8640, true) }), 32), target: num(-1, 31, true)
  };
  function cleanState(value) { return record(value, stateSpec) || null; }
  const commandValues = {
    speed: num(0.25, 3), volume: num(0, 300), seek: choice([-30, -10, 10, 30]),
    audio: choice(['stereo', 'mono']), quality: num(0, 127, true), target: num(-1, 31, true),
    adapter: choice(adapters.filter(item => item !== 'unknown')), filters, appearance,
    'subtitle-visible': bool, 'subtitle-offset': choice([-100, 0, 100]),
    'hotkeys': bool, 'presentation-active': bool
  };
  function cleanCues(value) {
    if (!Array.isArray(value) || value.length === 0 || value.length > 20000) return undefined;
    let size = 0, previousStart = -1;
    const result = [];
    for (const cue of value) {
      const safe = record(cue, { start: num(0, 864000), end: num(0, 864000),
        text: text => typeof text === 'string' && text.length <= 2000 ? text : undefined });
      if (!safe || safe.end <= safe.start || safe.start < previousStart || (size += safe.text.length) > 2000000) return undefined;
      previousStart = safe.start; result.push(safe);
    }
    return result;
  }
  function cleanCommand(value) {
    const base = record(value, { name: name => typeof name === 'string' ? name : undefined, owner: value => cleanSession(value) || undefined, revision });
    if (!base) return null;
    const rule = commandValues[base.name];
    if (Object.hasOwn(commandValues, base.name)) {
      const cleaned = rule(value.value);
      return cleaned === undefined ? null : { ...base, value: cleaned };
    }
    if (base.name === 'subtitle-load') {
      const cues = cleanCues(value.value); return cues ? { ...base, value: cues } : null;
    }
    return ['play', 'pip', 'refresh', 'ping', 'report', 'drm-info'].includes(base.name) ? base : null;
  }
  const videoSpec = {
    readyState: nullable(num(0, 4)), networkState: nullable(num(0, 3)), hasDecodedDimensions: bool,
    resolutionClass: choice(['unknown', 'sd', 'hd', 'fhd', 'qhd', 'uhd']), mediaMode: choice(['live', 'vod', 'unknown']),
    sourceKind: choice(['none', 'media-object', 'blob', 'http', 'other']), paused: bool, muted: bool,
    requestedPlaybackRate: nullable(num(0.25, 3)), playbackRateLock: choice(['element', 'event', 'off', 'unknown']),
    observedPlaybackRate: nullable(num(0.0625, 16)), requestedVolumePercent: nullable(num(0, 300)),
    observedNativeVolumePercent: nullable(num(0, 100)), observedGain: nullable(num(0, 3)),
    audioContextState: choice(['not-created', 'running', 'suspended', 'closed', 'interrupted', 'unknown']), audioSourceCreated: bool,
    audioMode: choice(['stereo', 'mono', 'unknown']), drmDetected: bool, isShadowDom: bool, subtitleLoaded: bool,
    subtitleLoadStatus: choice(['not-loaded', 'loaded', 'empty', 'read-error', 'unknown']), subtitleRenderStatus: choice([...subtitleStatus, 'unknown'])
  };
  const eventFields = {
    IVS_ATTACHED: [], IVS_CREATED: [], STREAM_DETECTED: [], STREAM_REDIRECTED: [], FULLSCREEN_ENTERED: [], FULLSCREEN_EXITED: [],
    DRM_DETECTED: [], SOURCE_SWITCH_STARTED: [], SOURCE_SWITCH_COMPLETED: [], PIP_FAILED: [], WEB_AUDIO_DRM_SKIPPED: [],
    AD_CONTROL_STARTED: [], AD_CONTROL_ENDED: [],
    SPEED_REQUESTED: ['rate'], SPEED_FAILED: [], VOLUME_REQUESTED: ['percent'], AUDIO_MODE_CHANGED: ['mono'], SEEK_REQUESTED: ['delta'],
    QUALITY_REQUESTED: ['height'], QUALITY_REJECTED: [], KICK_SPEED_SYNC: ['reactInvoked', 'ivsInvoked'],
    KICK_VOLUME_SYNC: ['reactInvoked', 'ivsInvoked'], KICK_SPEED_UI_INVOKED: ['rate'], KICK_SPEED_UI_UNAVAILABLE: [], KICK_SYNC_FAILED: [],
    TRT_RATE_REAPPLIED: ['rate'], TRT_RATE_GAVE_UP: [], TRT_RATE_INTERCEPTED: ['rate'],
    SUBTITLE_LOADED: [], SUBTITLE_PARSE_EMPTY: [], SUBTITLE_READ_FAILED: []
  };
  function cleanEvent(value) {
    if (!value || !Object.hasOwn(eventFields, value.event)) return undefined;
    const event = record(value, { ageSeconds: value => num(0, 3600, true)(value) !== undefined && value % 5 === 0 ? value : undefined,
      level: choice(['INFO', 'WARN', 'ERROR']), event: choice(Object.keys(eventFields)) });
    if (!event || !value.details || typeof value.details !== 'object') return undefined;
    event.details = {};
    const ranges = { rate: [0.25, 3], percent: [0, 300], mono: [0, 1], delta: [-30, 30], height: [0, 4320], reactInvoked: [0, 1], ivsInvoked: [0, 1] };
    for (const key of eventFields[event.event]) {
      if (!Object.hasOwn(value.details, key)) continue;
      const safe = num(...ranges[key])(value.details[key]);
      if (safe === undefined) return undefined;
      event.details[key] = safe;
    }
    return event;
  }
  function cleanReport(value) {
    const safe = record(value, {
      reportSchemaVersion: choice([2]), extensionVersion: version => typeof version === 'string' && /^\d{1,5}(?:\.\d{1,5}){0,3}$/.test(version) ? version : undefined,
      errorCode: choice(['NO_VIDEO_FOUND', 'USER_MANUAL_DIAGNOSTIC']), platform: choice(platforms), platformScope: choice(['player', 'page', 'unlisted']),
      browserFamily: choice(['firefox', 'chromium', 'safari', 'other']),
      playerType: choice(['none', 'shadow-html5', 'native-html5', 'youtube-player', 'amazon-ivs', 'videojs-attached', 'vjsPlayer', 'videojs-parent', 'videojs-global', 'hlsjs', 'shaka-player', 'unknown']),
      activeAdapter: choice(adapters), adapterTier: nullable(choice([1, 2, 3])), forcedAdapter: choice(adapters),
      forcedAdapterStatus: choice(['not-forced', 'no-video', 'selected', 'unavailable']), adapterSelectionStatus: choice(['healthy', 'failed', 'no-video', 'not-evaluated', 'unknown']),
      frame: shape({ context: choice(['top', 'iframe']), localFrameCount: choice(count), inaccessibleFrameCount: choice(count) }),
      videoCandidateCount: choice(count), videoState: nullable(shape(videoSpec)),
      quality: shape({ control: choice(['not-implemented', 'requires-runtime-verification']), requestedHeight: nullable(num(1, 4320)),
        cachedOptionCount: choice(count), verification: choice(verification), decodedMatch: nullable(bool), renditionMatch: nullable(bool),
        inventoryScope: choice(['player-and-source-menu', 'bound-hls-player', 'adapter']), inventoryCompleteness: choice(['not-verified']),
        adaptiveMode: choice(['auto', 'manual', 'unknown']), playerLevelCount: nullable(choice(count)), knownResolutionCount: nullable(choice(count)),
        manifestObserved: bool, declaredLevelCount: nullable(choice(count)) }),
      cdnMeasurementStatus: choice(['not-tested', 'no-video', 'no-source', 'timing-unavailable', 'resource-timing', 'head', 'http-rejected', 'timeout', 'blocked', 'unknown']),
      recentEvents: array(cleanEvent, 20), problem: choice(['unspecified', 'detection', 'quality', 'speed', 'volume', 'subtitles', 'pip', 'hud'])
    });
    return safe || null; // Comments/deletion preference are added only by the presentation's explicit user input.
  }
  function cleanReply(value) {
    const base = record(value, { owner: value => cleanSession(value) || undefined, id: revision, ok: bool, code: choice(['ok', 'stale', 'failed', 'unsupported', 'timeout']) });
    if (!base) return null;
    if (Object.hasOwn(value, 'ms')) { const ms = num(0, 60000)(value.ms); if (ms === undefined) return null; base.ms = ms; }
    if (Object.hasOwn(value, 'report')) { const report = cleanReport(value.report); if (!report) return null; base.report = report; }
    return base;
  }
  const cleanSession = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value) ? value : null;
  function newSession() {
    const bytes = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  }
  Object.defineProperty(globalThis, 'NOkFrameProtocol', { value: Object.freeze({ cleanState, cleanCommand, cleanCues, cleanReport, cleanReply, cleanSession, newSession, adapters }), configurable: false });
})();
