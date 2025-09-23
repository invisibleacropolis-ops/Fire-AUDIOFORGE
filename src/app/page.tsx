
"use client";

import { useState } from 'react';
import type { Track } from '@/hooks/use-audio-engine';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { AppHeader } from '@/components/audio-forge/header';
import { MasterTransportControls } from '@/components/audio-forge/transport-controls';
import { TrackView } from '@/components/audio-forge/track-view';
import { EffectsPanel } from '@/components/audio-forge/effects-panel';

export default function AudioForge() {
  const {
    isReady,
    tracks,
    addTrack,
    playFromStart,
    pausePlayback,
    stopPlayback,
    rewind,
    isPlaying,
    updateTrack,
    setTrackSelection,
    exportProject,
    importAudio,
    trimTrack,
    toggleTrackPlayback,
    stopTrackPlayback,
    rewindTrack,
    toggleTrackRecording,
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

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground font-body">
      <AppHeader onImport={handleFileImport} onExport={exportProject} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <MasterTransportControls
            isPlaying={isPlaying}
            onPlay={playFromStart}
            onPause={pausePlayback}
            onStop={stopPlayback}
            onRewind={rewind}
            onExport={exportProject}
          />
          <TrackView
            tracks={tracks}
            onAddTrack={handleAddNewTrack}
            onTrackSelect={setSelectedTrackId}
            selectedTrackId={selectedTrackId}
            onTrackUpdate={updateTrack}
            onTrim={trimTrack}
            onTrackRewind={rewindTrack}
            onTrackPlayPause={toggleTrackPlayback}
            onTrackStop={stopTrackPlayback}
            onTrackRecord={toggleTrackRecording}
            onSelectionChange={setTrackSelection}
          />
        </div>
        <EffectsPanel track={selectedTrack} onTrackUpdate={updateTrack} />
      </main>
    </div>
  );
}
