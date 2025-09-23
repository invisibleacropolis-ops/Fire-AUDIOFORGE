"use client";

import { useState } from 'react';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { AppHeader } from '@/components/audio-forge/header';
import {
  MasterRecordControls,
  MasterTransportControls,
} from '@/components/audio-forge/transport-controls';
import { TrackView } from '@/components/audio-forge/track-view';
import { EffectsPanel } from '@/components/audio-forge/effects-panel';
import { TooltipProvider } from '@/components/ui/tooltip';

/**
 * Top-level client wrapper that hosts the interactive audio workstation UI.
 *
 * The component stitches together the transport controls, track view, effect
 * editing side bar, and audio engine hook so that all Tone.js interactions are
 * centralized in one place. Keeping the entire workflow inside a dedicated
 * client component lets the Next.js page remain a server component, which in
 * turn prevents synchronous access of Next.js dynamic route params and removes
 * the associated runtime warnings introduced in Next 15.
 */
export function AudioForgeApp() {
  const {
    isReady,
    tracks,
    addTrack,
    updateTrack,
    setTrackSelection,
    trimTrack,
    toggleTrackPlayback,
    stopTrackPlayback,
    rewindTrack,
    toggleTrackLoop,
    toggleTrackRecording,
    importAudioToTrack,
    playFromStart,
    pausePlayback,
    stopPlayback,
    rewind,
    isPlaying,
    exportProject,
    isMasterRecording,
    isMasterPlayingBack,
    hasMasterRecording,
    toggleMasterRecording,
    toggleMasterPlayback,
    exportMasterRecording,
  } = useAudioEngine();

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? null;

  const handleTrackFileImport = async (trackId: string, file: File) => {
    const didImport = await importAudioToTrack(trackId, file);
    if (didImport) {
      setSelectedTrackId(trackId);
    }
  };

  const handleAddNewTrack = () => {
    const newTrackId = addTrack();
    setSelectedTrackId(newTrackId);
  };

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
      <AppHeader onExport={exportProject} />
      <main className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <TooltipProvider>
            <MasterTransportControls
              isPlaying={isPlaying}
              onPlay={playFromStart}
              onPause={pausePlayback}
              onStop={stopPlayback}
              onRewind={rewind}
              onExport={exportProject}
            />
            <MasterRecordControls
              isRecording={isMasterRecording}
              isPlayingBack={isMasterPlayingBack}
              hasRecording={hasMasterRecording}
              onRecordToggle={toggleMasterRecording}
              onPlaybackToggle={toggleMasterPlayback}
              onExport={exportMasterRecording}
            />
          </TooltipProvider>
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
            onTrackToggleLoop={toggleTrackLoop}
            onTrackRecord={toggleTrackRecording}
            onTrackImport={handleTrackFileImport}
            onSelectionChange={setTrackSelection}
          />
        </div>
        <EffectsPanel track={selectedTrack} onTrackUpdate={updateTrack} />
      </main>
    </div>
  );
}
