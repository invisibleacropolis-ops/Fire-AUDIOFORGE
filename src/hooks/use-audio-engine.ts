
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { useToast } from './use-toast';

// Type definitions
export type EffectType = 'reverb' | 'delay' | 'distortion' | 'chorus' | 'flanger' | 'phaser';

// Correctly type the effect nodes for Tone.js v15+
export type EffectNode = Tone.Reverb | Tone.FeedbackDelay | Tone.Distortion | Tone.Chorus | Tone.Flanger | Tone.Phaser;

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
};

// Helper to convert AudioBuffer to WAV
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


export function useAudioEngine() {
  const [isReady, setIsReady] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const tracksRef = useRef<Track[]>([]);
  const recorderRef = useRef<Tone.Recorder | null>(null);
  const userMediaRef = useRef<Tone.UserMedia | null>(null);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    const init = async () => {
      // Tone.start() is now implicitly called when needed and returns a promise
      // It's better to call it on a user interaction, like a button click
      setIsReady(true);
      recorderRef.current = new Tone.Recorder();
    };
    init();

    return () => {
      // Cleanup Tone.js objects
      tracksRef.current.forEach(t => {
        t.player?.dispose();
        t.channel?.dispose();
        t.effects.forEach(e => e.node?.dispose());
        if (t.url) {
            URL.revokeObjectURL(t.url);
        }
      });
      recorderRef.current?.dispose();
      userMediaRef.current?.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    }
  }, []);

  const startAudioContext = useCallback(async () => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    setIsStarted(true);
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
    };
    setTracks(prev => [...prev, newTrack]);
    return id;
  }, [tracks.length]);

  const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const importAudio = useCallback(async (file: File): Promise<string | null> => {
    try {
      const url = URL.createObjectURL(file);
      const player = new Tone.Player();
      await player.load(url);
      const duration = player.buffer.duration;
      
      const id = `track-${Date.now()}`;
      const channel = new Tone.Channel(0, 0).toDestination();
      player.connect(channel);

      const newTrack: Track = {
        id,
        name: file.name.split('.').slice(0, -1).join('.'),
        url,
        player,
        channel,
        effects: [],
        volume: 0,
        pan: 0,
        isMuted: false,
        isSoloed: false,
        duration,
      };

      setTracks(prev => [...prev, newTrack]);
      toast({ title: 'Audio imported successfully', description: file.name });
      return id;
    } catch (error) {
      console.error(error);
      toast({ title: 'Error importing audio', variant: 'destructive', description: 'The file might be corrupted or in an unsupported format.' });
      return null;
    }
  }, [toast]);
  
  const togglePlayback = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    if (Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!userMediaRef.current) {
        userMediaRef.current = new Tone.UserMedia();
        await userMediaRef.current.open();
      }
      userMediaRef.current.connect(recorderRef.current!);
      recorderRef.current?.start();
      setIsRecording(true);
      toast({ title: 'Recording started' });
    } catch (error) {
      toast({ title: 'Recording failed', description: 'Please ensure microphone permissions are granted.', variant: 'destructive' });
    }
  }, [toast]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) return;
    const recording = await recorderRef.current.stop();
    setIsRecording(false);
    
    const url = URL.createObjectURL(recording);
    const player = new Tone.Player();
    await player.load(url);
    const duration = player.buffer.duration;
    
    const id = `track-${Date.now()}`;
    const channel = new Tone.Channel(0, 0).toDestination();
    player.connect(channel);

    const newTrack: Track = {
      id,
      name: `Recording ${new Date().toLocaleTimeString()}`,
      url,
      player,
      channel,
      effects: [],
      volume: 0,
      pan: 0,
      isMuted: false,
      isSoloed: false,
      duration,
    };
    setTracks(prev => [...prev, newTrack]);
    toast({ title: 'Recording finished', description: 'New track added.' });
  }, [isRecording, toast]);

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

    try {
        const audioBuffer = track.player.buffer.get();
        if(!audioBuffer) return;

        const startSample = Math.floor(startTime * audioBuffer.sampleRate);
        const endSample = Math.floor(endTime * audioBuffer.sampleRate);
        const newLength = endSample - startSample;
        
        const newAudioBuffer = Tone.context.rawContext.createBuffer(
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
        
        const newPlayer = new Tone.Player();
        await newPlayer.load(newUrl);
        const newDuration = newPlayer.buffer.duration;

        track.player.dispose();
        if (track.url) {
            URL.revokeObjectURL(track.url);
        }
        
        updateTrack(trackId, {
            player: newPlayer,
            url: newUrl,
            duration: newDuration,
        });

        toast({ title: 'Track trimmed successfully' });
    } catch(e) {
        console.error(e);
        toast({ title: 'Trim failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
}, [updateTrack, toast]);

  const exportProject = useCallback(async () => {
    if (tracks.filter(t => t.url).length === 0) {
      toast({ title: 'Cannot export empty project', variant: 'destructive' });
      return;
    }

    toast({ title: 'Exporting project...', description: 'This may take a moment.' });
    
    try {
        const hasSolo = tracksRef.current.some(t => t.isSoloed);
        const tracksToExport = hasSolo ? tracksRef.current.filter(t => t.isSoloed) : tracksRef.current;

        const validTracks = tracksToExport.filter(t => t.player && t.player.loaded && !t.isMuted);

        if(validTracks.length === 0) {
            toast({ title: 'Nothing to export', description: 'No audible tracks to export.', variant: 'destructive'});
            return;
        }

        const duration = Math.max(0, ...validTracks.map(t => t.duration || 0));

        if(duration === 0) {
             toast({ title: 'Nothing to export', description: 'Tracks have no duration.', variant: 'destructive'});
            return;
        }
  
      const offlineBuffer = await Tone.Offline(async (offlineContext) => {
        const contextPlayers = validTracks.map(track => {
            const player = new Tone.Player(track.url!).toDestination();
            player.volume.value = track.volume;
            player.pan.value = track.pan;
            player.start(0);
            return player;
        });
        await Tone.loaded();

      }, duration);
  
      const wavBlob = bufferToWave(offlineBuffer);
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

      // Dispose of old effect nodes before creating new ones
      track.effects.forEach(e => e.node?.dispose());
      
      if(track.player && track.channel) {
        track.player.disconnect();

        // Create new effect nodes based on the updated track.effects array
        const newEffectNodes = track.effects.map((effect, index) => {
          let node: EffectNode | null = null;
          switch (effect.type) {
            case 'reverb': node = new Tone.Reverb({ wet: effect.wet }); break;
            case 'delay': node = new Tone.FeedbackDelay({ wet: effect.wet }); break;
            case 'distortion': node = new Tone.Distortion({ wet: effect.wet }); break;
            case 'chorus': node = new Tone.Chorus({ wet: effect.wet }); break;
            case 'flanger': node = new Tone.Flanger({ wet: effect.wet }); break;
            case 'phaser': node = new Tone.Phaser({ wet: effect.wet }); break;
          }
          if (node) {
            track.effects[index].node = node; // Update the node reference in the effect object
          }
          return node;
        }).filter((node): node is NonNullable<EffectNode> => node !== null);
        
        if (newEffectNodes.length > 0) {
            track.player.chain(...newEffectNodes, track.channel);
        } else {
            track.player.connect(track.channel);
        }
      }
    });

    // Cleanup function to dispose of effects when component unmounts
    return () => {
        tracks.forEach(track => {
            track.effects.forEach(effect => {
                effect.node?.dispose();
            });
        });
    };
  }, [tracks]);

  return {
    isReady,
    isStarted,
    startAudioContext,
    tracks,
    isPlaying,
    isRecording,
    addTrack,
    updateTrack,
    importAudio,
    togglePlayback,
    startRecording,
    stopRecording,
    exportProject,
    trimTrack,
  };
}
