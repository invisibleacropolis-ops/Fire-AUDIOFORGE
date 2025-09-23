
"use client";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Track as TrackComponent } from './track';
import type { Track } from '@/hooks/use-audio-engine';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

interface TrackViewProps {
  tracks: Track[];
  onAddTrack: () => void;
  onTrackSelect: (id: string) => void;
  selectedTrackId: string | null;
  onTrackUpdate: (id: string, updates: Partial<Track>) => void;
  onTrim: (id: string, start: number, end: number) => void;
  onTrackRewind: (id: string) => void;
  onTrackPlayPause: (id: string) => void;
  onTrackStop: (id: string) => void;
  onTrackToggleLoop: (id: string) => void;
  onTrackRecord: (id: string) => void;
  onTrackImport: (id: string, file: File) => Promise<void> | void;
  onSelectionChange: (id: string, selection: { start: number; end: number } | null) => void;
}

export function TrackView({
  tracks,
  onAddTrack,
  onTrackSelect,
  selectedTrackId,
  onTrackUpdate,
  onTrim,
  onTrackRewind,
  onTrackPlayPause,
  onTrackStop,
  onTrackToggleLoop,
  onTrackRecord,
  onTrackImport,
  onSelectionChange,
}: TrackViewProps) {
  return (
    <div className="flex-1 flex flex-col bg-background p-4 gap-4 overflow-hidden">
      <div className="flex-shrink-0">
        <Button onClick={onAddTrack} size="sm">
          <Plus />
          Add Track
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {tracks.length > 0 ? (
            tracks.map((track) => (
              <TrackComponent
                key={track.id}
                track={track}
                isSelected={track.id === selectedTrackId}
                onSelect={() => onTrackSelect(track.id)}
                onUpdate={onTrackUpdate}
                onTrim={onTrim}
                onRewind={onTrackRewind}
                onPlayPause={onTrackPlayPause}
                onStop={onTrackStop}
                onToggleLoop={onTrackToggleLoop}
                onRecord={onTrackRecord}
                onImport={onTrackImport}
                onSelectionChange={onSelectionChange}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">No tracks yet. Add a track or import an audio file to begin.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
