
"use client";

import { Play, Pause, Rewind, StopCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ButtonProps } from '@/components/ui/button';
import type { ReactNode } from 'react';

type ClickHandler = () => void | Promise<void>;


/**
 * Shared transport button wrapper so tooltips and button chrome remain
 * consistent. The handlers feed directly into the engine's transport actions.
 */
interface TransportButtonProps {
  icon: ReactNode;
  label: string;
  tooltip: string;
  onClick: ClickHandler;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function TransportButton({
  icon,
  label,
  tooltip,
  onClick,
  variant = 'outline',
  size = 'icon',
  className,
}: TransportButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          aria-label={label}
          variant={variant}
          size={size}
          onClick={() => {
            void onClick();
          }}
          className={className}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Props map to the high-level transport commands exposed by the engine hook.
 * Each callback is intentionally imperative so we can trigger Tone.start()
 * inside the handler when required.
 */
interface MasterTransportControlsProps {
  isPlaying: boolean;
  onPlay: ClickHandler;
  onPause: ClickHandler;
  onStop: ClickHandler;
  onRewind: ClickHandler;
  onExport: ClickHandler;
}

export function MasterTransportControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onRewind,
  onExport,
}: MasterTransportControlsProps) {
  const handlePlayPause = () => {
    if (isPlaying) {
      void onPause();
    } else {
      // Master play always rewinds before starting so the engine can sync
      // every Tone.Player against the Transport.
      void onPlay();
    }
  };

  return (

    <div className="flex items-center justify-center gap-4 bg-card border-t p-4">
      <TransportButton
        icon={<Rewind className="h-5 w-5" />}
        label="Rewind to start"
        tooltip="Rewind master transport to 0:00"
        onClick={onRewind}
      />
      <TransportButton
        icon={<StopCircle className="h-5 w-5" />}
        label="Stop playback"
        tooltip="Stop and reset the master transport"
        onClick={onStop}
      />
      <TransportButton
        icon={isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        label={isPlaying ? 'Pause playback' : 'Play from start'}
        tooltip={isPlaying ? 'Pause master playback' : 'Rewind and play from the beginning'}
        onClick={handlePlayPause}
        variant="primary"
        size="icon"
        className="w-12 h-12"
      />
      <TransportButton
        icon={<Download className="h-5 w-5" />}
        label="Export master mix"
        tooltip="Render an offline master mixdown to WAV"
        onClick={onExport}
      />
    </div>

  );
}

interface MasterRecordControlsProps {
  isRecording: boolean;
  isPlayingBack: boolean;
  hasRecording: boolean;
  onRecordToggle: ClickHandler;
  onPlaybackToggle: ClickHandler;
  onExport: ClickHandler;
}

export function MasterRecordControls({
  isRecording,
  isPlayingBack,
  hasRecording,
  onRecordToggle,
  onPlaybackToggle,
  onExport,
}: MasterRecordControlsProps) {
  return (
    <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-3">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Master Record
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'outline'}
          onClick={() => {
            void onRecordToggle();
          }}
        >
          {isRecording ? 'Stop' : 'Rec'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!hasRecording && !isPlayingBack}
          onClick={() => {
            void onPlaybackToggle();
          }}
        >
          {isPlayingBack ? 'Stop' : 'Play'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!hasRecording}
          onClick={() => {
            void onExport();
          }}
        >
          Export
        </Button>
      </div>
    </div>
  );
}
