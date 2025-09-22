
"use client";

import { useState } from 'react';
import type { Track as TrackType } from '@/hooks/use-audio-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Waveform } from './waveform';
import { Disc3, Mic, Pause, Play, Rewind, Scissors, StopCircle } from 'lucide-react';

interface TrackProps {
  track: TrackType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updates: Partial<TrackType>) => void;
  onTrim: (id: string, start: number, end: number) => void;
  onRewind: (id: string) => void;
  onPlayPause: (id: string) => void;
  onStop: (id: string) => void;
  onRecord: (id: string) => void;
}

export function Track({
  track,
  isSelected,
  onSelect,
  onUpdate,
  onTrim,
  onRewind,
  onPlayPause,
  onStop,
  onRecord,
}: TrackProps) {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);

  const handleVolumeChange = (value: number[]) => {
    onUpdate(track.id, { volume: value[0] });
  };

  const handlePanChange = (value: number[]) => {
    onUpdate(track.id, { pan: value[0] });
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(track.id, { name: e.target.value });
  };

  const handleMuteToggle = () => {
    onUpdate(track.id, { isMuted: !track.isMuted });
  };

  const handleSoloToggle = () => {
    onUpdate(track.id, { isSoloed: !track.isSoloed });
  };

  const handleTrim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selection && track) {
      onTrim(track.id, selection.start, selection.end);
      setSelection(null);
    }
  };

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'cursor-pointer transition-all',
        isSelected ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'
      )}
    >
      <CardContent className="p-3 flex gap-4 items-start">
        <div className="w-48 flex-shrink-0 space-y-3">
          <Input
            value={track.name}
            onChange={handleNameChange}
            className="h-8 text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center justify-between gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Rewind track"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRewind(track.id);
                  }}
                  disabled={!track.player}
                >
                  <Rewind className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Rewind</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="primary"
                  size="icon"
                  aria-label={track.isPlaying ? 'Pause track' : 'Play track'}
                  className="h-9 w-9"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPause(track.id);
                  }}
                  disabled={!track.player}
                >
                  {track.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{track.isPlaying ? 'Pause' : 'Play'}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Stop track"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop(track.id);
                  }}
                  disabled={!track.player}
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={track.isRecording ? 'destructive' : 'outline'}
                  size="icon"
                  aria-label={track.isRecording ? 'Stop recording track' : 'Record track'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRecord(track.id);
                  }}
                >
                  {track.isRecording ? (
                    <Disc3 className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{track.isRecording ? 'Stop Recording' : 'Record'}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={track.isMuted ? 'destructive' : 'outline'}
              onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
              className="w-1/2"
            >
              M
            </Button>
            <Button
              size="sm"
              variant={track.isSoloed ? 'secondary' : 'outline'}
              className={cn("w-1/2", track.isSoloed && "bg-yellow-500 text-black hover:bg-yellow-600")}
              onClick={(e) => { e.stopPropagation(); handleSoloToggle(); }}
            >
              S
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Volume</Label>
            <Slider
              value={[track.volume]}
              onValueChange={handleVolumeChange}
              max={6}
              min={-60}
              step={1}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pan</Label>
            <Slider
              value={[track.pan]}
              onValueChange={handlePanChange}
              max={1}
              min={-1}
              step={0.01}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-1 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={!selection || (selection.start === selection.end)}
              onClick={handleTrim}
            >
              <Scissors />
              Trim to Selection
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <Waveform
            url={track.url}
            duration={track.duration}
            onSelectionChange={setSelection}
          />
        </div>
      </CardContent>
    </Card>
  );
}
