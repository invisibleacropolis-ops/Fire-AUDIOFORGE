"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Circle, Square } from 'lucide-react';

interface TransportControlsProps {
  onPlayPause: () => void;
  isPlaying: boolean;
  onRecord: () => void;
  isRecording: boolean;
}

export function TransportControls({
  onPlayPause,
  isPlaying,
  onRecord,
  isRecording,
}: TransportControlsProps) {
  return (
    <Card className="rounded-none border-x-0 border-t-0">
      <CardContent className="p-2 flex justify-center gap-2">
        <Button variant="ghost" size="icon" onClick={onPlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onRecord} aria-label={isRecording ? 'Stop Recording' : 'Record'}>
          {isRecording ? <Square className="h-6 w-6 text-red-500 fill-red-500" /> : <Circle className="h-6 w-6 text-red-500" />}
        </Button>
      </CardContent>
    </Card>
  );
}
