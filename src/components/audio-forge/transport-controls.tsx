
"use client";

import { Play, Pause, Rewind, StopCircle, Mic, Disc3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TransportControlsProps {
  isPlaying: boolean;
  isRecording: boolean;
  onTogglePlayback: () => void;
  onStopPlayback: () => void;
  onRewind: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onExport: () => void;
}

export function TransportControls({
  isPlaying,
  isRecording,
  onTogglePlayback,
  onStopPlayback,
  onRewind,
  onStartRecording,
  onStopRecording,
  onExport
}: TransportControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 bg-card border-t p-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onRewind}>
            <Rewind className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rewind</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onStopPlayback}>
            <StopCircle className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Stop</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="primary" size="icon" onClick={onTogglePlayback} className="w-12 h-12">
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isPlaying ? 'Pause' : 'Play'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={isRecording ? 'destructive' : 'outline'} size="icon" onClick={isRecording ? onStopRecording : onStartRecording}>
            {isRecording ? <Disc3 className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isRecording ? 'Stop Recording' : 'Start Recording'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={onExport}>
            <Download className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export Project</TooltipContent>
      </Tooltip>
    </div>
  );
}
