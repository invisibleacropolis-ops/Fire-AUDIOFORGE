
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';
import * as Tone from 'tone';

// Type definitions
export type EffectType =
  | 'reverb'
  | 'delay'
  | 'distortion'
  | 'chorus'
  | 'phaser'
  | 'vibrato'
  | 'autoFilter'
  | 'compressor'
  | 'bitCrusher'
  | 'pitchShift';

// Correctly type the effect nodes for Tone.js v15+
export type EffectNode =
  | Tone.Reverb
  | Tone.FeedbackDelay
  | Tone.Distortion
  | Tone.Chorus
  | Tone.Phaser
  | Tone.Vibrato
  | Tone.AutoFilter
  | Tone.Compressor
  | Tone.BitCrusher
  | Tone.PitchShift;

export type Effect = {
  id: string;
  type: EffectType;
  wet: number;
  node: EffectNode | null;
  [key: string]: any;
};

export type Track = {
  id: string;
  name: string;
  url?: string;
  player: Tone.Player | null;
  channel: Tone.Channel | null;
  effects: Effect[];
  volume: number; // in dB
  pan: number; // -1 to 1
  isMuted: boolean;
  isSoloed: boolean;
  duration: number | null;
  isPlaying: boolean;
  isRecording: boolean;
  selectionStart: number | null;
  selectionEnd: number | null;
  isLooping: boolean;
  playheadPosition: number;
  audioBuffer: AudioBuffer | null;
  warmPlayers: Tone.Player[];
  isBuffering: boolean;
};

type PlaybackState = {
  startTime: number;
  offset: number;
  loopStart: number;
  loopEnd: number | null;
};

type MasterSyncState = 'unsynced' | 'idle' | 'scheduled';

const WARM_PLAYER_POOL_SIZE = 3;

function createPlayerFromAudioBuffer(audioBuffer: AudioBuffer): Tone.Player {
  const player = new Tone.Player();
  player.buffer.set(audioBuffer);
  // Short fades reduce the chance of pops when retriggering buffers rapidly.
  player.fadeIn = 0.01;
  player.fadeOut = 0.01;
  return player;
}

function createWarmPlayerPool(
  audioBuffer: AudioBuffer,
  size: number = WARM_PLAYER_POOL_SIZE
): Tone.Player[] {
  const players: Tone.Player[] = [];
  for (let index = 0; index < size; index += 1) {
    players.push(createPlayerFromAudioBuffer(audioBuffer));
  }
  return players;
}

function disposePlayerPool(pool: Tone.Player[]) {
  pool.forEach(player => {
    try {
      player.dispose();
    } catch (error) {
      console.warn('Failed to dispose warm player instance', error);
    }
  });
}

/**
 * Build a Tone.js node for the provided effect definition.
 *
 * Effects are instantiated on demand so we can serialize the lightweight
 * configuration in React state while recreating the heavier DSP nodes when
 * chaining players. Each case maps the persisted parameters to Tone's
 * constructor signature for v15+.
 */
function applyWetValue(node: any, wet: number) {
  if (!node) {
    return;
  }

  const candidateWet = (node as { wet?: { value: number } }).wet;
  if (candidateWet && typeof candidateWet.value === 'number') {
    candidateWet.value = wet;
  }
}

async function instantiateEffectNode(
  effect: Effect
): Promise<EffectNode | null> {
  let node: EffectNode | null = null;

  switch (effect.type) {
    case 'reverb': {
      const reverb = new Tone.Reverb({
        wet: effect.wet,
        decay: effect.decay ?? 1.5,
        preDelay: effect.preDelay ?? 0.01,
      });
      // Reverb buffers are generated asynchronously in Tone.js 15, so the
      // instance must finish preparing its impulse response before any wet
      // signal is audible. Waiting here avoids the "all dry" or silent output
      // users reported when pushing the wet mix to 100%.
      await reverb.ready;
      node = reverb;
      break;
    }
    case 'delay':
      node = new Tone.FeedbackDelay({
        wet: effect.wet,
        delayTime: effect.delayTime ?? 0.25,
        feedback: effect.feedback ?? 0.5,
      });
      break;
    case 'distortion':
      node = new Tone.Distortion({
        wet: effect.wet,
        distortion: effect.distortion ?? 0.4,
      });
      break;
    case 'chorus': {
      const chorus = new Tone.Chorus({
        wet: effect.wet,
        frequency: effect.frequency ?? 1.5,
        delayTime: effect.delayTime ?? 3.5,
        depth: effect.depth ?? 0.7,
      });
      // Chorus' modulation LFOs are opt-in in Tone.js 15, so explicitly start
      // them to honor the wet mix and produce the detuned effect instead of a
      // dry bypass signal.
      chorus.start();
      node = chorus;
      break;
    }
    case 'phaser':
      node = new Tone.Phaser({
        wet: effect.wet,
        frequency: effect.frequency ?? 0.5,
        octaves: effect.octaves ?? 3,
        baseFrequency: effect.baseFrequency ?? 350,
      });
      break;
    case 'vibrato':
      node = new Tone.Vibrato({
        wet: effect.wet,
        frequency: effect.frequency ?? 5,
        depth: effect.depth ?? 0.1,
      });
      break;
    case 'autoFilter': {
      const autoFilter = new Tone.AutoFilter({
        wet: effect.wet,
        frequency: effect.frequency ?? 1.5,
        depth: effect.depth ?? 0.5,
        baseFrequency: effect.baseFrequency ?? 200,
        octaves: effect.octaves ?? 2,
      });
      autoFilter.start();
      node = autoFilter;
      break;
    }
    case 'compressor': {
      const compressor = new Tone.Compressor({
        threshold: effect.threshold ?? -24,
        ratio: effect.ratio ?? 12,
        attack: effect.attack ?? 0.003,
        release: effect.release ?? 0.25,
      });
      applyWetValue(compressor, effect.wet);
      node = compressor;
      break;
    }
    case 'bitCrusher': {
      const bitCrusher = new Tone.BitCrusher({
        bits: effect.bits ?? 4,
      });
      applyWetValue(bitCrusher, effect.wet);
      node = bitCrusher;
      break;
    }
    case 'pitchShift':
      node = new Tone.PitchShift({
        wet: effect.wet,
        pitch: effect.pitch ?? 0,
        feedback: effect.feedback ?? 0,
        delayTime: effect.delayTime ?? 0,
        windowSize: effect.windowSize ?? 0.1,
      });
      break;
  }

  return node;
}

function isEffectNodeOfType(effectType: EffectType, node: EffectNode): boolean {
  switch (effectType) {
    case 'reverb':
      return node instanceof Tone.Reverb;
    case 'delay':
      return node instanceof Tone.FeedbackDelay;
    case 'distortion':
      return node instanceof Tone.Distortion;
    case 'chorus':
      return node instanceof Tone.Chorus;
    case 'phaser':
      return node instanceof Tone.Phaser;
    case 'vibrato':
      return node instanceof Tone.Vibrato;
    case 'autoFilter':
      return node instanceof Tone.AutoFilter;
    case 'compressor':
      return node instanceof Tone.Compressor;
    case 'bitCrusher':
      return node instanceof Tone.BitCrusher;
    case 'pitchShift':
      return node instanceof Tone.PitchShift;
    default:
      return false;
  }
}

function updateEffectNodeParameters(effect: Effect, node: EffectNode) {
  applyWetValue(node, effect.wet);

  switch (effect.type) {
    case 'reverb':
      if (node instanceof Tone.Reverb) {
        node.decay = effect.decay ?? 1.5;
        node.preDelay = effect.preDelay ?? 0.01;
      }
      break;
    case 'delay':
      if (node instanceof Tone.FeedbackDelay) {
        node.delayTime.value = effect.delayTime ?? 0.25;
        node.feedback.value = effect.feedback ?? 0.5;
      }
      break;
    case 'distortion':
      if (node instanceof Tone.Distortion) {
        node.distortion = effect.distortion ?? 0.4;
      }
      break;
    case 'chorus':
      if (node instanceof Tone.Chorus) {
        node.frequency.value = effect.frequency ?? 1.5;
        node.delayTime = effect.delayTime ?? 3.5;
        node.depth = effect.depth ?? 0.7;
      }
      break;
    case 'phaser':
      if (node instanceof Tone.Phaser) {
        node.frequency.value = effect.frequency ?? 0.5;
        node.octaves = effect.octaves ?? 3;
        node.baseFrequency = effect.baseFrequency ?? 350;
      }
      break;
    case 'vibrato':
      if (node instanceof Tone.Vibrato) {
        node.frequency.value = effect.frequency ?? 5;
        node.depth.value = effect.depth ?? 0.1;
      }
      break;
    case 'autoFilter':
      if (node instanceof Tone.AutoFilter) {
        node.frequency.value = effect.frequency ?? 1.5;
        node.depth.value = effect.depth ?? 0.5;
        node.baseFrequency = effect.baseFrequency ?? 200;
        node.octaves = effect.octaves ?? 2;
      }
      break;
    case 'compressor':
      if (node instanceof Tone.Compressor) {
        node.threshold.value = effect.threshold ?? -24;
        node.ratio.value = effect.ratio ?? 12;
        node.attack.value = effect.attack ?? 0.003;
        node.release.value = effect.release ?? 0.25;
      }
      break;
    case 'bitCrusher':
      if (node instanceof Tone.BitCrusher) {
        node.bits.value = effect.bits ?? 4;
      }
      break;
    case 'pitchShift':
      if (node instanceof Tone.PitchShift) {
        node.pitch = effect.pitch ?? 0;
        node.feedback.value = effect.feedback ?? 0;
        node.delayTime.value = effect.delayTime ?? 0;
        node.windowSize = effect.windowSize ?? 0.1;
      }
      break;
  }
}

/**
 * Convert an AudioBuffer into a downloadable WAV Blob.
 *
 * The offline renderer and trim feature both rely on Tone.js buffers. To allow
 * exporting those buffers we manually build a RIFF/WAV header and interleave
 * the PCM samples. The resulting blob can be converted to an object URL for
 * downloads or reloaded into a Player.
 */
function bufferToWave(abuffer: AudioBuffer): Blob {
    const numOfChan = abuffer.numberOfChannels;
    const C = abuffer.getChannelData(0);
    const L = C.length;
    const buffer = new ArrayBuffer(44 + L * numOfChan * 2);
    const view = new DataView(buffer);
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };

    const setUint32 = (data: number) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };

    setUint32(0x46464952); // "RIFF"
    setUint32(36 + L * numOfChan * 2); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length of format data
    setUint16(1); // type of format (1=PCM)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // bits/sample
    setUint32(0x61746164); // "data" -chunk
    setUint32(L * numOfChan * 2); // chunk length

    for (let i = 0; i < L; i++) {
        for (let k = 0; k < numOfChan; k++) {
            let s = Math.max(-1, Math.min(1, abuffer.getChannelData(k)[i]));
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(pos, s, true);
            pos += 2;
        }
    }

    return new Blob([view], { type: 'audio/wav' });
}


/**
 * React hook that encapsulates the Tone.js backed audio engine.
 *
 * The hook abstracts track lifecycle (load, playback, record, trim), master
 * transport control, and effect routing while exposing imperative callbacks for
 * UI components. Tone.js state lives behind refs so React renders stay pure and
 * deterministic.
 */
export function useAudioEngine() {
  const [isReady, setIsReady] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTrackId, setRecordingTrackId] = useState<string | null>(null);
  const [isMasterRecording, setIsMasterRecording] = useState(false);
  const [isMasterPlayingBack, setIsMasterPlayingBack] = useState(false);
  const [masterRecordingUrl, setMasterRecordingUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const tracksRef = useRef<Track[]>([]);
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const masterRecorderRef = useRef<Tone.Recorder | null>(null);
  const masterRecordingPlayerRef = useRef<Tone.Player | null>(null);
  const masterRecordingBlobRef = useRef<Blob | null>(null);
  const masterRecordingBufferRef = useRef<AudioBuffer | null>(null);
  const masterRecordingUrlRef = useRef<string | null>(null);
  const userMediaRef = useRef<Tone.UserMedia | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  // playbackStateRef keeps a lightweight clock for every playing track so we
  // can translate Tone.now() deltas into UI playhead positions without
  // repeatedly polling Tone.Player for state.
  const playbackStateRef = useRef<Map<string, PlaybackState>>(new Map());
  const masterSyncStateRef = useRef<Map<string, MasterSyncState>>(new Map());
  const effectNodeRegistry = useRef<Map<string, EffectNode>>(new Map());

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    const registry = effectNodeRegistry.current;

    const init = async () => {
      // Tone.js contexts must be primed inside a user gesture, so the hook only
      // prepares simple state and leaves Tone.start() to the caller when
      // transport actions actually fire.
      setIsReady(true);
      recorderRef.current = new Tone.Recorder();
      masterRecorderRef.current = new Tone.Recorder();
      try {
        Tone.Destination.connect(masterRecorderRef.current);
      } catch (error) {
        console.warn('Failed to connect master recorder', error);
      }
    };
    void init();

    return () => {
      // Dispose every node we created so React unmounts do not leak WebAudio
      // resources or blob URLs. When a track is destroyed we release its
      // Player, Channel, effect nodes, and any object URLs for imported audio.
      tracksRef.current.forEach(t => {
        t.player?.dispose();
        disposePlayerPool(t.warmPlayers);
        t.channel?.dispose();
        t.effects.forEach(e => e.node?.dispose());
        if (t.url) {
            URL.revokeObjectURL(t.url);
        }
      });
      registry.forEach(node => node.dispose());
      registry.clear();
      recorderRef.current?.dispose();
      if (masterRecorderRef.current) {
        try {
          Tone.Destination.disconnect(masterRecorderRef.current);
        } catch (error) {
          console.warn('Failed to disconnect master recorder', error);
        }
      }
      masterRecorderRef.current?.dispose();
      masterRecordingPlayerRef.current?.dispose();
      if (masterRecordingUrlRef.current) {
        URL.revokeObjectURL(masterRecordingUrlRef.current);
      }
      userMediaRef.current?.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  const addTrack = useCallback((): string => {
    const id = `track-${Date.now()}`;
    const channel = new Tone.Channel(0, 0).toDestination();
    const newTrack: Track = {
      id,
      name: `Track ${tracks.length + 1}`,
      player: null,
      channel,
      effects: [],
      volume: 0,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      duration: null,
      isPlaying: false,
      isRecording: false,
      selectionStart: null,
      selectionEnd: null,
      isLooping: false,
      playheadPosition: 0,
      audioBuffer: null,
      warmPlayers: [],
      isBuffering: false,
    };
    masterSyncStateRef.current.set(id, 'unsynced');
    setTracks(prev => [...prev, newTrack]);
    return id;
  }, [tracks.length]);

  const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const getTrackSelectionBounds = useCallback(
    (track: Track): { start: number; end: number | null; duration: number | undefined } => {
      const bufferDuration = track.player?.buffer?.duration ?? track.duration ?? 0;
      const start = Math.max(0, Math.min(track.selectionStart ?? 0, bufferDuration));

      if (!bufferDuration) {
        return { start: 0, end: null, duration: undefined };
      }

      if (track.selectionEnd == null) {
        const remaining = bufferDuration - start;
        return {
          start,
          end: null,
          duration: remaining > 0 ? remaining : undefined,
        };
      }

      const clampedEnd = Math.max(start, Math.min(track.selectionEnd, bufferDuration));
      if (clampedEnd <= start) {
        const remaining = bufferDuration - start;
        return {
          start,
          end: null,
          duration: remaining > 0 ? remaining : undefined,
        };
      }

      return {
        start,
        end: clampedEnd,
        duration: clampedEnd - start,
      };
    },
    []
  );

  const configureLoopForTrack = useCallback(
    (
      track: Track,
      start: number,
      end: number | null
    ): { loopEnd: number | null; shouldLoop: boolean } => {
      if (!track.player) {
        return { loopEnd: null, shouldLoop: false };
      }

      const candidateLoopEnd = track.isLooping ? end ?? track.duration ?? null : null;
      const shouldLoop = candidateLoopEnd !== null && candidateLoopEnd > start;

      track.player.loop = shouldLoop;
      if (shouldLoop) {
        // Tone.Player expects loopStart/loopEnd in seconds relative to the
        // underlying buffer.
        track.player.loopStart = start;
        track.player.loopEnd = candidateLoopEnd;
      }

      return { loopEnd: shouldLoop ? candidateLoopEnd : null, shouldLoop };
    },
    []
  );

  const resyncPlayerToMaster = useCallback(
    (
      track: Track,
      options: { scheduleStart?: boolean; offset?: number } = {}
    ) => {
      const player = track.player;
      if (!player) {
        return;
      }

      const { scheduleStart = false, offset } = options;

      const { start, end, duration } = getTrackSelectionBounds(track);
      const { shouldLoop } = configureLoopForTrack(track, start, end);
      const transportState = Tone.Transport.state;
      const context = Tone.getContext();
      const epsilon = 1 / context.sampleRate;
      const scheduleTime =
        transportState === 'started'
          ? Tone.Transport.seconds + epsilon
          : 0;

      const bufferDuration =
        track.duration ?? player.buffer?.duration ?? undefined;
      const selectionEnd =
        end ??
        (duration !== undefined ? start + duration : bufferDuration ?? undefined);

      let effectiveOffset = offset ?? start;
      effectiveOffset = Math.max(start, effectiveOffset);
      if (selectionEnd != null) {
        effectiveOffset = Math.min(effectiveOffset, selectionEnd);
      } else if (bufferDuration != null) {
        effectiveOffset = Math.min(effectiveOffset, bufferDuration);
      }

      const offsetDelta = Math.max(effectiveOffset - start, 0);

      // Always clear any previously scheduled events before wiring the player
      // back to the master transport. When a track has been auditioned outside
      // of the transport (`Player.start` without `sync()`), Tone keeps the
      // unsynced start time in the internal StateTimeline. Attempting to add a
      // new synced event at time 0 would otherwise throw because the timeline
      // must remain monotonic.
      player.unsync();
      player.sync();

      let nextSyncState: MasterSyncState = 'idle';
      let startPlayback = scheduleStart;
      let playbackDuration: number | undefined = shouldLoop
        ? undefined
        : duration;

      if (!shouldLoop && playbackDuration !== undefined) {
        const remaining = playbackDuration - offsetDelta;
        if (remaining <= 0) {
          startPlayback = false;
        } else {
          playbackDuration = remaining;
        }
      }

      if (startPlayback) {
        if (playbackDuration === undefined) {
          player.start(scheduleTime, effectiveOffset);
        } else {
          player.start(scheduleTime, effectiveOffset, playbackDuration);
        }
        nextSyncState = 'scheduled';
      }

      const effectiveDuration =
        duration ?? track.duration ?? player.buffer?.duration ?? null;

      if (transportState === 'started') {
        const elapsed = Math.max(Tone.Transport.seconds - scheduleTime, 0);
        let nextOffset = effectiveOffset;

        if (shouldLoop && effectiveDuration && effectiveDuration > 0) {
          const loopProgress =
            ((elapsed % effectiveDuration) + effectiveDuration) % effectiveDuration;
          nextOffset = effectiveOffset + loopProgress;
        } else if (effectiveDuration != null) {
          nextOffset = Math.min(
            effectiveOffset + elapsed,
            effectiveOffset + effectiveDuration
          );
        } else {
          nextOffset = effectiveOffset + elapsed;
        }

        player.seek(nextOffset);
      } else {
        player.seek(effectiveOffset);
      }

      if (!startPlayback) {
        nextSyncState = 'idle';
      }

      masterSyncStateRef.current.set(track.id, nextSyncState);
    },
    [configureLoopForTrack, getTrackSelectionBounds]
  );

  const unsyncPlayerFromMaster = useCallback(
    (track: Track) => {
      const player = track.player;
      if (!player) {
        return;
      }

      if (masterSyncStateRef.current.get(track.id) === 'unsynced') {
        return;
      }

      player.unsync();
      masterSyncStateRef.current.set(track.id, 'unsynced');
    },
    []
  );

  /**
   * Prepare a Tone.Player for use within a track's signal chain.
   *
   * The helper centralizes the wiring required whenever we replace a track's
   * player instance. It ensures the player is routed through the track's
   * channel, defaults to an unsynced state for per-track transport controls,
   * and optionally re-synchronizes with the global master transport when the
   * track expects to participate in project-wide playback.
   */
  const prepareTrackPlayer = useCallback(
    (track: Track, player: Tone.Player): Tone.Channel => {
      const channel = track.channel ?? new Tone.Channel(0, 0).toDestination();
      player.disconnect();
      player.connect(channel);

      const syncState = masterSyncStateRef.current.get(track.id) ?? 'unsynced';
      const shouldResync = syncState !== 'unsynced';
      const trackWithPlayer: Track = { ...track, player, channel };

      unsyncPlayerFromMaster(trackWithPlayer);

      if (shouldResync) {
        resyncPlayerToMaster(trackWithPlayer, {
          scheduleStart: syncState === 'scheduled',
        });
      }

      return channel;
    },
    [resyncPlayerToMaster, unsyncPlayerFromMaster]
  );

  const setTrackSelection = useCallback(
    (id: string, selection: { start: number; end: number } | null) => {
      const target = tracksRef.current.find(track => track.id === id);
      if (!target) {
        return;
      }

      const nextSelectionStart = selection ? selection.start : null;
      const nextSelectionEnd = selection ? selection.end : null;
      const nextTrackState: Track = {
        ...target,
        selectionStart: nextSelectionStart,
        selectionEnd: nextSelectionEnd,
        playheadPosition: target.playheadPosition,
      };

      const { start, end } = getTrackSelectionBounds(nextTrackState);
      const { loopEnd } = configureLoopForTrack(nextTrackState, start, end);

      nextTrackState.playheadPosition = start;

      const playback = playbackStateRef.current.get(id);
      if (playback) {
        playback.startTime = Tone.now();
        playback.offset = start;
        playback.loopStart = start;
        playback.loopEnd = loopEnd;
      } else if (target.player?.loaded && target.player.state !== 'started') {
        target.player.seek(start);
      }

      tracksRef.current = tracksRef.current.map(track =>
        track.id === id
          ? {
              ...track,
              selectionStart: nextSelectionStart,
              selectionEnd: nextSelectionEnd,
              playheadPosition: start,
            }
          : track
      );

      setTracks(prev =>
        prev.map(t =>
          t.id === id
            ? {
                ...t,
                selectionStart: nextSelectionStart,
                selectionEnd: nextSelectionEnd,
                playheadPosition: start,
              }
            : t
        )
      );
    },
    [configureLoopForTrack, getTrackSelectionBounds]
  );

  const decodeFileToAudioBuffer = useCallback(async (file: File) => {
    const cacheKey = `${file.name}:${file.lastModified}:${file.size}`;
    const cachedBuffer = bufferCacheRef.current.get(cacheKey);
    if (cachedBuffer) {
      return cachedBuffer;
    }

    const arrayBuffer = await file.arrayBuffer();
    const context = Tone.getContext();
    if (context.state !== 'running') {
      await Tone.start();
    }
    const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      context.rawContext.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
    });
    bufferCacheRef.current.set(cacheKey, audioBuffer);
    return audioBuffer;
  }, []);

  const decodeBlobToAudioBuffer = useCallback(async (blob: Blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const context = Tone.getContext();
    if (context.state !== 'running') {
      await Tone.start();
    }
    return new Promise<AudioBuffer>((resolve, reject) => {
      context.rawContext.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
    });
  }, []);

  const allocateWarmPlayer = useCallback(
    (track: Track): { player: Tone.Player; pool: Tone.Player[] } | null => {
      if (!track.audioBuffer) {
        return null;
      }

      const pool = [...track.warmPlayers];
      const nextPlayer = pool.shift() ?? createPlayerFromAudioBuffer(track.audioBuffer);

      while (pool.length < WARM_PLAYER_POOL_SIZE) {
        pool.push(createPlayerFromAudioBuffer(track.audioBuffer));
      }

      return { player: nextPlayer, pool };
    },
    []
  );

  const updateTrackBufferingState = useCallback((trackId: string, isBuffering: boolean) => {
    tracksRef.current = tracksRef.current.map(track =>
      track.id === trackId ? { ...track, isBuffering } : track
    );
    setTracks(prev =>
      prev.map(track => (track.id === trackId ? { ...track, isBuffering } : track))
    );
  }, []);

  /**
   * Load an audio file into an existing track. The previous player/url
   * resources are disposed to avoid leaking Tone.js nodes or blob URLs so
   * that repeated imports stay stable for long-lived sessions. Audio data is
   * decoded manually so we can reuse buffers across the app without
   * re-decoding on every action.
   */
  const importAudioToTrack = useCallback(
    async (trackId: string, file: File): Promise<boolean> => {
      const targetTrack = tracksRef.current.find(track => track.id === trackId);

      if (!targetTrack) {
        toast({
          title: 'Import failed',
          description: 'The selected track could not be found.',
          variant: 'destructive',
        });
        return false;
      }

      updateTrackBufferingState(trackId, true);

      let url: string | null = null;
      let player: Tone.Player | null = null;
      let warmPlayers: Tone.Player[] = [];
      let shouldDispose = true;

      try {
        const audioBuffer = await decodeFileToAudioBuffer(file);
        url = URL.createObjectURL(file);
        player = createPlayerFromAudioBuffer(audioBuffer);
        warmPlayers = createWarmPlayerPool(audioBuffer);
        const duration = audioBuffer.duration;

        disposePlayerPool(targetTrack.warmPlayers);
        if (targetTrack.player) {
          targetTrack.player.dispose();
        }
        if (targetTrack.url) {
          URL.revokeObjectURL(targetTrack.url);
        }

        const baseTrack: Track = {
          ...targetTrack,
          name: file.name.split('.').slice(0, -1).join('.') || file.name,
          url,
          player,
          channel: targetTrack.channel ?? new Tone.Channel(0, 0).toDestination(),
          duration,
          isPlaying: false,
          isRecording: false,
          selectionStart: null,
          selectionEnd: null,
          playheadPosition: 0,
          audioBuffer,
          warmPlayers,
          isBuffering: false,
        };

        const channel = prepareTrackPlayer(baseTrack, player);
        const updatedTrack: Track = { ...baseTrack, channel };

        tracksRef.current = tracksRef.current.map(track =>
          track.id === trackId ? updatedTrack : track
        );
        setTracks(prev => prev.map(track => (track.id === trackId ? updatedTrack : track)));
        playbackStateRef.current.delete(trackId);

        toast({ title: 'Audio imported successfully', description: file.name });
        shouldDispose = false;
        player = null;
        url = null;
        warmPlayers = [];
        return true;
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error importing audio',
          variant: 'destructive',
          description: 'The file might be corrupted or in an unsupported format.',
        });
        return false;
      } finally {
        if (shouldDispose) {
          player?.dispose();
          disposePlayerPool(warmPlayers);
          if (url) {
            URL.revokeObjectURL(url);
          }
        }

        updateTrackBufferingState(trackId, false);
      }
    },
    [
      decodeFileToAudioBuffer,
      prepareTrackPlayer,
      toast,
      updateTrackBufferingState,
    ]
  );
  
  const ensureContextRunning = useCallback(async () => {
    const context = Tone.getContext();
    if (context.state !== 'running') {
      await Tone.start();
    }
  }, []);

  const resetPlayersToStart = useCallback(() => {
    const now = Tone.now();
    playbackStateRef.current.clear();

    const nextTracks = tracksRef.current.map(track => {
      const { start, end } = getTrackSelectionBounds(track);
      const { loopEnd } = configureLoopForTrack(track, start, end);

      if (track.player?.loaded) {
        track.player.seek(start);
        playbackStateRef.current.set(track.id, {
          startTime: now,
          offset: start,
          loopStart: start,
          loopEnd,
        });
      } else {
        playbackStateRef.current.delete(track.id);
      }

      return {
        ...track,
        isPlaying: false,
        playheadPosition: start,
      };
    });

    tracksRef.current = nextTracks;
    setTracks(nextTracks);
  }, [configureLoopForTrack, getTrackSelectionBounds, setTracks]);

  const playFromStart = useCallback(async () => {
    await ensureContextRunning();

    const resumingFromPause = Tone.Transport.state === 'paused';
    const transportSeconds = resumingFromPause ? Tone.Transport.seconds : 0;
    const now = Tone.now();

    if (!resumingFromPause) {
      Tone.Transport.stop();
      Tone.Transport.position = 0;
    }

    playbackStateRef.current.clear();

    const nextTracks = tracksRef.current.map(track => {
      const { start, end, duration } = getTrackSelectionBounds(track);
      const { loopEnd } = configureLoopForTrack(track, start, end);
      const hasPlayer = Boolean(track.player?.loaded);

      let offset = start;

      if (resumingFromPause) {
        let resumeOffset = start + transportSeconds;

        if (loopEnd !== null && loopEnd > start) {
          const loopLength = loopEnd - start;
          if (loopLength > 0) {
            const normalizedSeconds =
              ((transportSeconds % loopLength) + loopLength) % loopLength;
            resumeOffset = start + normalizedSeconds;
          } else {
            resumeOffset = start;
          }
        } else if (duration !== undefined) {
          resumeOffset = Math.min(resumeOffset, start + duration);
        } else if (track.duration != null) {
          resumeOffset = Math.min(resumeOffset, track.duration);
        }

        if (track.duration != null) {
          resumeOffset = Math.min(resumeOffset, track.duration);
        }

        offset = Math.max(start, resumeOffset);
      }

      if (hasPlayer) {
        const syncSource: Track = { ...track, player: track.player };
        resyncPlayerToMaster(syncSource, { scheduleStart: true, offset });
        playbackStateRef.current.set(track.id, {
          startTime: now,
          offset,
          loopStart: start,
          loopEnd,
        });
      } else {
        playbackStateRef.current.delete(track.id);
      }

      return {
        ...track,
        isPlaying: hasPlayer,
        playheadPosition: hasPlayer ? offset : start,
      };
    });

    tracksRef.current = nextTracks;
    setTracks(nextTracks);

    Tone.Transport.start();
    setIsPlaying(true);
  }, [
    configureLoopForTrack,
    ensureContextRunning,
    getTrackSelectionBounds,
    resyncPlayerToMaster,
  ]);

  const pausePlayback = useCallback(() => {
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      resetPlayersToStart();
      setIsPlaying(false);
    }
  }, [resetPlayersToStart]);

  const stopPlayback = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    resetPlayersToStart();
    setIsPlaying(false);
  }, [resetPlayersToStart]);

  const rewind = useCallback(() => {
    Tone.Transport.pause();
    Tone.Transport.position = 0;
    resetPlayersToStart();
    setIsPlaying(false);
  }, [resetPlayersToStart]);

  useEffect(() => {
    const handleTransportStop = () => {
      resetPlayersToStart();
      setIsPlaying(false);
    };

    Tone.Transport.on('stop', handleTransportStop);

    return () => {
      Tone.Transport.off('stop', handleTransportStop);
    };
  }, [resetPlayersToStart]);

  const startMasterRecording = useCallback(async () => {
    if (isMasterRecording) {
      toast({
        title: 'Recording in progress',
        description: 'Stop the current master recording before starting a new one.',
        variant: 'destructive',
      });
      return;
    }

    if (!masterRecorderRef.current) {
      masterRecorderRef.current = new Tone.Recorder();
      try {
        Tone.Destination.connect(masterRecorderRef.current);
      } catch (error) {
        console.warn('Failed to connect master recorder', error);
      }
    }

    if (masterRecordingPlayerRef.current) {
      masterRecordingPlayerRef.current.stop();
      setIsMasterPlayingBack(false);
    }
    masterRecordingBlobRef.current = null;
    masterRecordingBufferRef.current = null;
    if (masterRecordingUrlRef.current) {
      URL.revokeObjectURL(masterRecordingUrlRef.current);
      masterRecordingUrlRef.current = null;
    }
    setMasterRecordingUrl(null);

    try {
      await ensureContextRunning();
      masterRecorderRef.current?.start();
      setIsMasterRecording(true);
      toast({ title: 'Master recording started', description: 'Capturing master output.' });
    } catch (error) {
      console.error(error);
      setIsMasterRecording(false);
      toast({
        title: 'Recording failed',
        description: 'Unable to start the master recorder.',
        variant: 'destructive',
      });
    }
  }, [ensureContextRunning, isMasterRecording, toast]);

  const stopMasterRecording = useCallback(async () => {
    if (!masterRecorderRef.current || !isMasterRecording) {
      return;
    }

    try {
      const recording = await masterRecorderRef.current.stop();
      setIsMasterRecording(false);
      masterRecordingBlobRef.current = recording;

      const previousUrl = masterRecordingUrlRef.current;
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }

      const url = URL.createObjectURL(recording);
      masterRecordingUrlRef.current = url;
      setMasterRecordingUrl(url);

      try {
        const buffer = await decodeBlobToAudioBuffer(recording);
        masterRecordingBufferRef.current = buffer;
        toast({
          title: 'Master recording captured',
          description: 'Ready for playback and export.',
        });
      } catch (error) {
        console.error(error);
        masterRecordingBufferRef.current = null;
        toast({
          title: 'Master recording captured',
          description: 'Export is available, but playback could not be prepared.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error(error);
      setIsMasterRecording(false);
      toast({
        title: 'Recording failed',
        description: 'Unable to capture the master output.',
        variant: 'destructive',
      });
    }
  }, [decodeBlobToAudioBuffer, isMasterRecording, toast]);

  const toggleMasterRecording = useCallback(async () => {
    if (isMasterRecording) {
      await stopMasterRecording();
    } else {
      await startMasterRecording();
    }
  }, [isMasterRecording, startMasterRecording, stopMasterRecording]);

  const toggleMasterPlayback = useCallback(async () => {
    if (isMasterPlayingBack) {
      masterRecordingPlayerRef.current?.stop();
      return;
    }

    const buffer = masterRecordingBufferRef.current;
    if (!buffer) {
      toast({
        title: 'No master recording',
        description: 'Record the master output before playing back.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await ensureContextRunning();
      const player = createPlayerFromAudioBuffer(buffer);
      masterRecordingPlayerRef.current?.dispose();
      masterRecordingPlayerRef.current = player;
      player.connect(Tone.Destination);
      player.onstop = () => {
        setIsMasterPlayingBack(false);
        if (masterRecordingPlayerRef.current === player) {
          masterRecordingPlayerRef.current = null;
        }
        player.dispose();
      };
      player.start();
      setIsMasterPlayingBack(true);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Playback failed',
        description: 'Unable to play the master recording.',
        variant: 'destructive',
      });
      masterRecordingPlayerRef.current?.dispose();
      masterRecordingPlayerRef.current = null;
      setIsMasterPlayingBack(false);
    }
  }, [ensureContextRunning, isMasterPlayingBack, toast]);

  const exportMasterRecording = useCallback(() => {
    const recording = masterRecordingBlobRef.current;
    if (!recording) {
      toast({
        title: 'No master recording',
        description: 'Capture the master output before exporting.',
        variant: 'destructive',
      });
      return;
    }

    let url = masterRecordingUrlRef.current;
    if (!url) {
      url = URL.createObjectURL(recording);
      masterRecordingUrlRef.current = url;
      setMasterRecordingUrl(url);
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    anchor.download = `master-recording-${timestamp}.wav`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    toast({ title: 'Master recording exported', description: 'Download started.' });
  }, [toast]);

  const startRecording = useCallback(async () => {
    if (isRecording && recordingTrackId) {
      toast({ title: 'Recording in progress', description: 'Stop the current track recording before starting a new one.', variant: 'destructive' });
      return;
    }

    try {
      if (!userMediaRef.current) {
        userMediaRef.current = new Tone.UserMedia();
        await userMediaRef.current.open();
      }
      userMediaRef.current.connect(recorderRef.current!);
      recorderRef.current?.start();
      setIsRecording(true);
      setRecordingTrackId(null);
      toast({ title: 'Recording started' });
    } catch (error) {
      toast({ title: 'Recording failed', description: 'Please ensure microphone permissions are granted.', variant: 'destructive' });
    }
  }, [isRecording, recordingTrackId, toast]);

  const stopTrackRecording = useCallback(async (trackId: string) => {
    if (!recorderRef.current || !isRecording || recordingTrackId !== trackId) return;

    updateTrackBufferingState(trackId, true);
    // Recorder.stop() resolves with a Blob containing the captured PCM data.
    const recording = await recorderRef.current.stop();
    setIsRecording(false);
    setRecordingTrackId(null);

    const track = tracksRef.current.find(t => t.id === trackId);
    if (!track) {
      toast({ title: 'Recording failed', description: 'Track no longer exists.', variant: 'destructive' });
      updateTrackBufferingState(trackId, false);
      return;
    }

    let url: string | null = null;
    let player: Tone.Player | null = null;
    let warmPlayers: Tone.Player[] = [];

    try {
      const audioBuffer = await decodeBlobToAudioBuffer(recording);
      url = URL.createObjectURL(recording);
      player = createPlayerFromAudioBuffer(audioBuffer);
      warmPlayers = createWarmPlayerPool(audioBuffer);
      const duration = audioBuffer.duration;

      track.player?.dispose();
      disposePlayerPool(track.warmPlayers);
      if (track.url) {
        URL.revokeObjectURL(track.url);
      }

      const preparedTrack: Track = {
        ...track,
        url,
        player,
        channel: track.channel ?? new Tone.Channel(0, 0).toDestination(),
        duration,
        isRecording: false,
        isPlaying: false,
        selectionStart: null,
        selectionEnd: null,
        playheadPosition: 0,
        audioBuffer,
        warmPlayers,
        isBuffering: false,
      };

      const channel = prepareTrackPlayer(preparedTrack, player);
      const updatedTrack: Track = { ...preparedTrack, channel };

      tracksRef.current = tracksRef.current.map(t =>
        t.id === trackId ? updatedTrack : t
      );

      setTracks(prev =>
        prev.map(t => (t.id === trackId ? updatedTrack : t))
      );
      toast({ title: 'Recording finished', description: `${track.name} updated.` });
    } catch (error) {
      console.error(error);
      toast({ title: 'Recording failed', description: 'Unable to process the recorded audio.', variant: 'destructive' });
      if (url) {
        URL.revokeObjectURL(url);
        url = null;
      }
      player?.dispose();
      disposePlayerPool(warmPlayers);
    } finally {
      updateTrackBufferingState(trackId, false);
    }
  }, [
    decodeBlobToAudioBuffer,
    isRecording,
    prepareTrackPlayer,
    recordingTrackId,
    toast,
    updateTrackBufferingState,
  ]);

  const stopRecording = useCallback(async () => {
    if (recordingTrackId) {
      await stopTrackRecording(recordingTrackId);
      return;
    }

    if (!recorderRef.current || !isRecording) return;
    // Fallback path creates a new track when recording outside the context of
    // an existing strip.
    const recording = await recorderRef.current.stop();
    setIsRecording(false);

    let url: string | null = null;
    let player: Tone.Player | null = null;
    let warmPlayers: Tone.Player[] = [];

    try {
      const audioBuffer = await decodeBlobToAudioBuffer(recording);
      url = URL.createObjectURL(recording);
      player = createPlayerFromAudioBuffer(audioBuffer);
      warmPlayers = createWarmPlayerPool(audioBuffer);
      const duration = audioBuffer.duration;

      const id = `track-${Date.now()}`;
      const baseTrack: Track = {
        id,
        name: `Recording ${new Date().toLocaleTimeString()}`,
        url,
        player,
        channel: new Tone.Channel(0, 0).toDestination(),
        effects: [],
        volume: 0,
        pan: 0,
        isMuted: false,
        isSoloed: false,
        duration,
        isPlaying: false,
        isRecording: false,
        selectionStart: null,
        selectionEnd: null,
        isLooping: false,
        playheadPosition: 0,
        audioBuffer,
        warmPlayers,
        isBuffering: false,
      };
      const channel = prepareTrackPlayer(baseTrack, player);
      const newTrack: Track = { ...baseTrack, channel };
      setTracks(prev => [...prev, newTrack]);
      toast({ title: 'Recording finished', description: 'New track added.' });
    } catch (error) {
      console.error(error);
      toast({ title: 'Recording failed', description: 'Unable to process the recorded audio.', variant: 'destructive' });
      if (url) {
        URL.revokeObjectURL(url);
      }
      player?.dispose();
      disposePlayerPool(warmPlayers);
    }
  }, [
    decodeBlobToAudioBuffer,
    isRecording,
    prepareTrackPlayer,
    recordingTrackId,
    stopTrackRecording,
    toast,
  ]);

  const startTrackRecording = useCallback(async (trackId: string) => {
    if (isRecording && recordingTrackId && recordingTrackId !== trackId) {
      toast({ title: 'Recording in progress', description: 'Stop the current track recording before starting a new one.', variant: 'destructive' });
      return;
    }

    if (isRecording && recordingTrackId === trackId) {
      return;
    }

    try {
      if (!userMediaRef.current) {
        userMediaRef.current = new Tone.UserMedia();
        await userMediaRef.current.open();
      }
      // Route the microphone feed through a shared Tone.Recorder so we can
      // capture live audio and feed it back into a synced Player.
      userMediaRef.current.connect(recorderRef.current!);
      recorderRef.current?.start();
      setIsRecording(true);
      setRecordingTrackId(trackId);
      setTracks(prev => prev.map(t => ({ ...t, isRecording: t.id === trackId })));
      const trackName = tracksRef.current.find(t => t.id === trackId)?.name ?? 'track';
      toast({ title: 'Track recording started', description: `Recording ${trackName}.` });
    } catch (error) {
      toast({ title: 'Recording failed', description: 'Please ensure microphone permissions are granted.', variant: 'destructive' });
    }
  }, [isRecording, recordingTrackId, toast]);

  const toggleTrackRecording = useCallback(async (trackId: string) => {
    if (isRecording && recordingTrackId === trackId) {
      await stopTrackRecording(trackId);
    } else {
      await startTrackRecording(trackId);
    }
  }, [isRecording, recordingTrackId, startTrackRecording, stopTrackRecording]);

  const stopTrackPlayback = useCallback(
    (trackId: string) => {
      const track = tracksRef.current.find(t => t.id === trackId);
      if (!track?.player) {
        return;
      }

      const { start, end } = getTrackSelectionBounds(track);
      track.player.onstop = () => {};
      track.player.stop();
      playbackStateRef.current.delete(trackId);
      const syncTarget: Track = {
        ...track,
        player: track.player,
        playheadPosition: start,
      };
      configureLoopForTrack(syncTarget, start, end);
      resyncPlayerToMaster(syncTarget, { scheduleStart: false });
      track.player.seek(start);
      setTracks(prev =>
        prev.map(t =>
          t.id === trackId ? { ...t, isPlaying: false, playheadPosition: start } : t
        )
      );
    },
    [configureLoopForTrack, getTrackSelectionBounds, resyncPlayerToMaster]
  );

  const rewindTrack = useCallback(
    (trackId: string) => {
      const track = tracksRef.current.find(t => t.id === trackId);
      if (!track?.player) {
        return;
      }

      const { start, end } = getTrackSelectionBounds(track);
      track.player.onstop = () => {};
      track.player.stop();
      playbackStateRef.current.delete(trackId);
      const syncTarget: Track = {
        ...track,
        player: track.player,
        playheadPosition: start,
      };
      configureLoopForTrack(syncTarget, start, end);
      resyncPlayerToMaster(syncTarget, { scheduleStart: false });
      track.player.seek(start);
      setTracks(prev =>
        prev.map(t =>
          t.id === trackId ? { ...t, isPlaying: false, playheadPosition: start } : t
        )
      );
    },
    [configureLoopForTrack, getTrackSelectionBounds, resyncPlayerToMaster]
  );

  const toggleTrackPlayback = useCallback(
    async (trackId: string) => {
      const track = tracksRef.current.find(t => t.id === trackId);
      if (!track || !track.player) {
        return;
      }

      const context = Tone.getContext();
      if (context.state !== 'running') {
        await Tone.start();
      }

      const { start, end, duration } = getTrackSelectionBounds(track);

      if (track.player.state === 'started') {
        stopTrackPlayback(trackId);
        return;
      }

      const trackSnapshot: Track = { ...track, player: track.player };
      unsyncPlayerFromMaster(trackSnapshot);

      const resetPlayer = (playerInstance: Tone.Player) => {
        playerInstance.onstop = () => {};
        playerInstance.stop();
        playerInstance.seek(start);
      };

      resetPlayer(track.player);
      const { loopEnd, shouldLoop } = configureLoopForTrack(trackSnapshot, start, end);

      const assignOnStop = (playerInstance: Tone.Player) => {
        playerInstance.onstop = () => {
          playbackStateRef.current.delete(trackId);
          const latest = tracksRef.current.find(t => t.id === trackId);
          const startPosition = latest ? getTrackSelectionBounds(latest).start : start;
          setTracks(prev =>
            prev.map(t =>
              t.id === trackId
                ? { ...t, isPlaying: false, playheadPosition: startPosition }
                : t
            )
          );

          const resyncSource =
            latest ?? { ...trackSnapshot, player: playerInstance, playheadPosition: startPosition };
          if (resyncSource.player) {
            resyncPlayerToMaster(resyncSource, { scheduleStart: false });
          }

          playerInstance.onstop = () => {};
        };
      };

      assignOnStop(track.player);

      playbackStateRef.current.set(trackId, {
        startTime: Tone.now(),
        offset: start,
        loopStart: start,
        loopEnd,
      });

      setTracks(prev =>
        prev.map(t => {
          if (t.id === trackId) {
            return { ...t, isPlaying: true, playheadPosition: start };
          }
          return t.isPlaying ? { ...t, isPlaying: false } : t;
        })
      );

      const startWithPlayer = (playerInstance: Tone.Player) => {
        if (shouldLoop || duration === undefined) {
          playerInstance.start(undefined, start);
        } else {
          playerInstance.start(undefined, start, duration);
        }
      };

      try {
        startWithPlayer(track.player);
      } catch (error) {
        console.error('Failed to start player, attempting warm instance swap.', error);
        const latest = tracksRef.current.find(t => t.id === trackId) ?? trackSnapshot;
        const allocation = allocateWarmPlayer(latest);

        if (!allocation) {
          playbackStateRef.current.delete(trackId);
          setTracks(prev =>
            prev.map(t =>
              t.id === trackId ? { ...t, isPlaying: false } : t.isPlaying ? { ...t, isPlaying: false } : t
            )
          );
          toast({
            title: 'Playback error',
            description: 'Audio failed to start. Try re-importing the file.',
            variant: 'destructive',
          });
          return;
        }

        const { player: replacement, pool } = allocation;
        latest.player?.dispose();

        const baseTrack: Track = {
          ...latest,
          player: replacement,
          warmPlayers: pool,
          playheadPosition: start,
          isPlaying: true,
        };

        const channel = prepareTrackPlayer(baseTrack, replacement);
        const refreshedTrack: Track = { ...baseTrack, channel };
        configureLoopForTrack(refreshedTrack, start, end);
        assignOnStop(replacement);

        tracksRef.current = tracksRef.current.map(t =>
          t.id === trackId ? refreshedTrack : t
        );

        setTracks(prev =>
          prev.map(t => {
            if (t.id === trackId) {
              return { ...refreshedTrack, playheadPosition: start, isPlaying: true };
            }
            return t.isPlaying ? { ...t, isPlaying: false } : t;
          })
        );

        try {
          startWithPlayer(replacement);
        } catch (fallbackError) {
          console.error('Fallback player failed to start.', fallbackError);
          playbackStateRef.current.delete(trackId);
          setTracks(prev =>
            prev.map(t =>
              t.id === trackId ? { ...t, isPlaying: false } : t
            )
          );
          toast({
            title: 'Playback error',
            description: 'Unable to start playback for this track.',
            variant: 'destructive',
          });
        }
      }
    },
    [
      allocateWarmPlayer,
      configureLoopForTrack,
      getTrackSelectionBounds,
      prepareTrackPlayer,
      resyncPlayerToMaster,
      stopTrackPlayback,
      toast,
      unsyncPlayerFromMaster,
    ]
  );

  const toggleTrackLoop = useCallback(
    (trackId: string) => {
      const track = tracksRef.current.find(t => t.id === trackId);
      if (!track) {
        return;
      }

      const nextLooping = !track.isLooping;
      const updatedTrack: Track = { ...track, isLooping: nextLooping };
      const { start, end } = getTrackSelectionBounds(updatedTrack);
      const { loopEnd } = configureLoopForTrack(updatedTrack, start, end);

      const playback = playbackStateRef.current.get(trackId);
      if (playback) {
        playback.loopStart = start;
        playback.loopEnd = loopEnd;
        playback.startTime = Tone.now();
        playback.offset = track.playheadPosition;
      }

      tracksRef.current = tracksRef.current.map(t =>
        t.id === trackId ? { ...t, isLooping: nextLooping } : t
      );

      setTracks(prev =>
        prev.map(t =>
          t.id === trackId ? { ...t, isLooping: nextLooping } : t
        )
      );
    },
    [configureLoopForTrack, getTrackSelectionBounds]
  );

  useEffect(() => {
    let rafId: number;

    // Mirror Tone.js playback with UI playheads. We cannot rely on Tone
    // scheduling callbacks for UI because React state updates must run on the
    // main thread, so we sample Tone.now() inside requestAnimationFrame.
    const updatePlayheads = () => {
      const now = Tone.now();
      const updates: Record<string, number> = {};

      tracksRef.current.forEach(track => {
        const playback = playbackStateRef.current.get(track.id);
        if (!playback || !track.player || track.player.state !== 'started') {
          return;
        }

        let position = playback.offset + (now - playback.startTime);
        const loopStart = playback.loopStart;
        const loopEndCandidate = playback.loopEnd ?? (track.isLooping ? track.duration ?? null : null);

        if (track.isLooping && loopEndCandidate !== null && loopEndCandidate > loopStart) {
          const loopLength = loopEndCandidate - loopStart;
          if (loopLength > 0) {
            const relative = position - loopStart;
            position = loopStart + ((relative % loopLength) + loopLength) % loopLength;
          }
        }

        if (track.duration != null) {
          position = Math.min(position, track.duration);
        }

        if (Math.abs(track.playheadPosition - position) > 0.01) {
          updates[track.id] = position;
        }
      });

      if (Object.keys(updates).length > 0) {
        setTracks(prev =>
          prev.map(track =>
            updates[track.id] !== undefined
              ? { ...track, playheadPosition: updates[track.id]! }
              : track
          )
        );
      }

      rafId = requestAnimationFrame(updatePlayheads);
    };

    rafId = requestAnimationFrame(updatePlayheads);
    return () => cancelAnimationFrame(rafId);
  }, []);

  /**
   * Destructively trims a track's buffer to the provided time range.
   *
   * The Tone.Player buffer is copied into a new AudioBuffer containing only the
   * selected window. We then rebuild the Player instance so scheduling and
   * effect routing stay in sync with the shorter asset.
   */
  const trimTrack = useCallback(async (trackId: string, startTime: number, endTime: number) => {
    const track = tracksRef.current.find(t => t.id === trackId);
    if (!track || !track.player?.loaded || !track.duration) {
      toast({ title: 'Trim failed', description: 'Track not ready for trimming.', variant: 'destructive' });
      return;
    }

    if (startTime >= endTime || startTime < 0 || endTime > track.duration) {
        toast({ title: 'Invalid trim selection', variant: 'destructive' });
        return;
    }

    updateTrackBufferingState(trackId, true);

    try {
        const audioBuffer = track.audioBuffer ?? track.player.buffer.get();
        if(!audioBuffer) {
          toast({ title: 'Trim failed', description: 'Unable to access audio data.', variant: 'destructive' });
          return;
        }

        const startSample = Math.floor(startTime * audioBuffer.sampleRate);
        const endSample = Math.floor(endTime * audioBuffer.sampleRate);
        const newLength = endSample - startSample;
        
        const newAudioBuffer = Tone.getContext().rawContext.createBuffer(
            audioBuffer.numberOfChannels,
            newLength,
            audioBuffer.sampleRate
        );

        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            const oldChannelData = audioBuffer.getChannelData(i);
            const newChannelData = newAudioBuffer.getChannelData(i);
            newChannelData.set(oldChannelData.subarray(startSample, endSample));
        }
        
        const wavBlob = bufferToWave(newAudioBuffer);
        const newUrl = URL.createObjectURL(wavBlob);

        const newPlayer = createPlayerFromAudioBuffer(newAudioBuffer);
        const warmPlayers = createWarmPlayerPool(newAudioBuffer);
        const newDuration = newAudioBuffer.duration;

        track.player.dispose();
        disposePlayerPool(track.warmPlayers);
        if (track.url) {
            URL.revokeObjectURL(track.url);
        }

        const preparedTrack: Track = {
            ...track,
            player: newPlayer,
            url: newUrl,
            duration: newDuration,
            selectionStart: null,
            selectionEnd: null,
            playheadPosition: 0,
            audioBuffer: newAudioBuffer,
            warmPlayers,
        };
        const channel = prepareTrackPlayer(preparedTrack, newPlayer);
        const finalTrack: Track = { ...preparedTrack, channel };
        tracksRef.current = tracksRef.current.map(t =>
            t.id === trackId ? finalTrack : t
        );
        updateTrack(trackId, {
            player: newPlayer,
            url: newUrl,
            duration: newDuration,
            selectionStart: null,
            selectionEnd: null,
            playheadPosition: 0,
            audioBuffer: newAudioBuffer,
            warmPlayers,
        });
        playbackStateRef.current.delete(trackId);

        toast({ title: 'Track trimmed successfully' });
    } catch(e) {
        console.error(e);
        toast({ title: 'Trim failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        updateTrackBufferingState(trackId, false);
    }
}, [prepareTrackPlayer, updateTrack, toast, updateTrackBufferingState]);

  /**
   * Render the current session into a WAV mixdown.
   *
   * Export uses Tone.Offline so every track plays from the beginning with its
   * current mute/solo state, channel settings, and effect chain. The offline
   * buffer is converted to a Blob which we immediately trigger as a download.
   */
  const exportProject = useCallback(async () => {
    if (tracks.filter(t => t.url || t.audioBuffer).length === 0) {
      toast({ title: 'Cannot export empty project', variant: 'destructive' });
      return;
    }

    toast({ title: 'Exporting project...', description: 'This may take a moment.' });
    
    try {
        const hasSolo = tracksRef.current.some(t => t.isSoloed);
        const preparedTracks = tracksRef.current.filter(
          t => t.player && t.player.loaded && (t.audioBuffer || t.url)
        );

        const validTracks = preparedTracks.filter(t =>
          hasSolo ? t.isSoloed : !t.isMuted
        );

        if(validTracks.length === 0) {
            toast({ title: 'Nothing to export', description: 'No audible tracks to export.', variant: 'destructive'});
            return;
        }

        const duration = Math.max(0, ...validTracks.map(t => t.duration || 0));

        if(duration === 0) {
             toast({ title: 'Nothing to export', description: 'Tracks have no duration.', variant: 'destructive'});
            return;
        }
  
      // Tone.Offline deterministically replays the scene without the live
      // Transport so we can render a bounce. We recreate the mix graph inside
      // the callback, honoring solo/mute logic and chaining fresh effect nodes
      // per track before starting each Player at time 0.
      const offlineBuffer = await Tone.Offline(async () => {
        for (const track of validTracks) {
          const channel = new Tone.Channel();
          channel.volume.value = track.volume;
          channel.pan.value = track.pan;
          channel.mute = hasSolo ? !track.isSoloed : track.isMuted;
          channel.toDestination();

          const effectNodes = (
            await Promise.all(track.effects.map(instantiateEffectNode))
          ).filter((node): node is EffectNode => node !== null);

          const player = track.audioBuffer
            ? createPlayerFromAudioBuffer(track.audioBuffer)
            : new Tone.Player(track.url!);

          if (effectNodes.length > 0) {
            player.chain(...effectNodes, channel);
          } else {
            player.connect(channel);
          }

          player.start(0);
        }

        // Wait for every Player in the offline context to finish scheduling
        // before Tone resolves the rendered buffer.
        await Tone.loaded();
      }, duration);

      const renderedBuffer = offlineBuffer.get();

      if (!renderedBuffer) {
        throw new Error('Offline rendering returned an empty buffer.');
      }

      const wavBlob = bufferToWave(renderedBuffer);
      const downloadUrl = URL.createObjectURL(wavBlob);
      const anchor = document.createElement('a');
      anchor.download = 'AudioForge-Project.wav';
      anchor.href = downloadUrl;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
      toast({ title: 'Export successful!', variant: 'default' });
    } catch(e) {
      console.error(e);
      toast({ title: 'Export failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  }, [toast, tracks]);

  // Effect and channel property handler
  useEffect(() => {
    const soloedTracks = tracks.filter(t => t.isSoloed);
    const hasSolo = soloedTracks.length > 0;

    tracks.forEach(track => {
      if (track.channel) {
        track.channel.volume.value = track.volume;
        track.channel.pan.value = track.pan;
        track.channel.mute = hasSolo ? !track.isSoloed : track.isMuted;
      }
    });

    let isCancelled = false;

    // Rebuild the tone graph asynchronously because certain effects (e.g. the
    // Reverb impulse generator) need time to finish initializing before any
    // wet signal is audible.
    const rebuildEffectGraphs = async () => {
      const activeEffectIds = new Set<string>();
      const trackEffectMap = new Map<string, EffectNode[]>();

      for (const track of tracks) {
        if (!track.player || !track.channel) {
          continue;
        }

        const effectNodes: EffectNode[] = [];

        for (const effect of track.effects) {
          activeEffectIds.add(effect.id);

          let node = effectNodeRegistry.current.get(effect.id) ?? effect.node ?? null;

          if (!node || !isEffectNodeOfType(effect.type, node)) {
            node?.dispose();
            node = await instantiateEffectNode(effect);

            if (isCancelled) {
              node?.dispose();
              return;
            }

            if (node) {
              effectNodeRegistry.current.set(effect.id, node);
            } else {
              effectNodeRegistry.current.delete(effect.id);
            }
          }

          if (node) {
            updateEffectNodeParameters(effect, node);
            effect.node = node;
            effectNodes.push(node);
          }
        }

        trackEffectMap.set(track.id, effectNodes);
      }

      if (isCancelled) {
        return;
      }

      tracks.forEach(track => {
        if (!track.player || !track.channel) {
          return;
        }

        track.player.disconnect();

        const effectNodes = trackEffectMap.get(track.id) ?? [];
        if (effectNodes.length > 0) {
          track.player.chain(...effectNodes, track.channel);
        } else {
          track.player.connect(track.channel);
        }
      });

      effectNodeRegistry.current.forEach((node, id) => {
        if (!activeEffectIds.has(id)) {
          node.dispose();
          effectNodeRegistry.current.delete(id);
        }
      });
    };

    void rebuildEffectGraphs();

    return () => {
      isCancelled = true;
    };
  }, [tracks]);

  const hasMasterRecording = masterRecordingUrl !== null;

  return {
    isReady,
    tracks,
    isPlaying,
    isRecording,
    isMasterRecording,
    isMasterPlayingBack,
    hasMasterRecording,
    addTrack,
    updateTrack,
    setTrackSelection,
    importAudioToTrack,
    playFromStart,
    pausePlayback,
    stopPlayback,
    rewind,
    toggleMasterRecording,
    toggleMasterPlayback,
    exportMasterRecording,
    startRecording,
    stopRecording,
    toggleTrackPlayback,
    stopTrackPlayback,
    rewindTrack,
    toggleTrackLoop,
    toggleTrackRecording,
    exportProject,
    trimTrack,
  };
}
