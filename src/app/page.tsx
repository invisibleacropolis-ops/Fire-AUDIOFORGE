
"use client";

import { useState } from 'react';
import type { Track } from '@/hooks/use-audio-engine';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { AppHeader } from '@/components/audio-forge/header';
import { TransportControls } from '@/components/audio-forge/transport-controls';
import { TrackView } from '@/components/audio-forge/track-view';
import { EffectsPanel } from '@/components/audio-forge/effects-panel';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

export default function AudioForge() {
  const {
    isReady,
    isStarted,
    startAudioContext,
    tracks,
    addTrack,
    togglePlayback,
    isPlaying,
    isRecording,
    startRecording,
    stopRecording,
    updateTrack,
    exportProject,
    importAudio,
    trimTrack,
  } = useAudioEngine();

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const selectedTrack = tracks.find(t => t.id === selectedTrackId) ?? null;

  const handleFileImport = async (file: File) => {
    const newTrackId = await importAudio(file);
    if (newTrackId) {
      setSelectedTrackId(newTrackId);
    }
  };

  const handleAddNewTrack = () => {
    const newTrackId = addTrack();
    setSelectedTrackId(newTrackId);
  }

  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Initializing Audio Engine...</p>
        </div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-6 text-center p-4">
            <Volume2 size={48} className="text-primary" />
            <h1 className="text-2xl font-bold">Welcome to AudioForge</h1>
            <p className="text-muted-foreground max-w-md">
              To begin, please grant audio permissions by clicking the button below. This is required for recording and playing audio.
            </p>
            <Button size="lg" onClick={startAudioContext}>
              Start AudioForge
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground font-body">
      <AppHeader onImport={handleFileImport} onExport={exportProject} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <TransportControls
            onPlayPause={togglePlayback}
            isPlaying={isPlaying}
            onRecord={isRecording ? stopRecording : startRecording}
            isRecording={isRecording}
          />
          <TrackView
            tracks={tracks}
            onAddTrack={handleAddNewTrack}
            onTrackSelect={setSelectedTrackId}
            selectedTrackId={selectedTrackId}
            onTrackUpdate={updateTrack}
            onTrim={trimTrack}
          />
        </div>
        <EffectsPanel track={selectedTrack} onTrackUpdate={updateTrack} />
      </main>
    </div>
  );
}
