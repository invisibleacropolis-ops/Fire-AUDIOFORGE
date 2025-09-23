"use client";

import { Play, Pause, Rewind, StopCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ButtonProps } from '@/components/ui/button';
import type { ReactNode } from 'react';

type ClickHandler = () => void | Promise<void>;

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
