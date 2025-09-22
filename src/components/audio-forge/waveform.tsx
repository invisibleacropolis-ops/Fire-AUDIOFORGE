
"use client";

import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import * as Tone from 'tone';

interface WaveformProps {
  trackId: string;
  url?: string;
  selection: { start: number; end: number } | null;
  onSelectionChange?: (trackId: string, selection: { start: number; end: number } | null) => void;
  duration: number | null;
}

const WaveformComponent: React.FC<WaveformProps> = ({ trackId, url, onSelectionChange, duration, selection: selectionProp }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveform, setWaveform] = useState<Float32Array | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(selectionProp);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(0);

  useEffect(() => {
    setSelection(selectionProp);
  }, [selectionProp]);

  useEffect(() => {
    if (!url) {
      setWaveform(null);
      setSelection(null);
      onSelectionChange?.(trackId, null);
      return;
    }

    let mounted = true;
    const loadWaveform = async () => {
      try {
        const buffer = new Tone.Buffer(url, () => {
          if (mounted) {
            setWaveform(buffer.getChannelData(0));
          }
          buffer.dispose();
        });
      } catch (error) {
        console.error("Error loading waveform data:", error);
      }
    };
    loadWaveform();

    // Reset selection when URL changes
    setSelection(null);
    onSelectionChange?.(trackId, null);

    return () => {
      mounted = false;
    };
  }, [url, onSelectionChange, trackId]);
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const { width, height } = canvas;
    const amp = height / 2;
    context.clearRect(0, 0, width, height);

    if (!waveform) return;

    context.lineWidth = 2;
    context.strokeStyle = 'hsl(var(--accent))';
    context.beginPath();
    
    const step = Math.ceil(waveform.length / width);
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = waveform[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      context.moveTo(i, (1 + min) * amp);
      context.lineTo(i, (1 + max) * amp);
    }
    context.stroke();

    if (selection) {
      context.fillStyle = 'hsla(var(--primary), 0.3)';
      const startX = (selection.start / (duration || 1)) * width;
      const endX = (selection.end / (duration || 1)) * width;
      context.fillRect(startX, 0, endX - startX, height);
    }
  }, [waveform, selection, duration]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(draw);
    });
    resizeObserver.observe(canvas);
    
    requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
    };
  }, [draw]);

  const pixelsToTime = (pixels: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return 0;
    return Math.max(0, (pixels / canvas.width) * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setIsDragging(true);
    dragStartRef.current = x;
    const time = pixelsToTime(x);
    const newSelection = { start: time, end: time };
    setSelection(newSelection);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const startTime = pixelsToTime(dragStartRef.current);
    const endTime = pixelsToTime(x);
    const newSelection = {
      start: Math.min(startTime, endTime),
      end: Math.max(startTime, endTime)
    };
    setSelection(newSelection);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (selection && selection.start !== selection.end) {
      onSelectionChange?.(trackId, selection);
    } else {
      setSelection(null);
      onSelectionChange?.(trackId, null);
    }
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  if (!url) {
    return (
        <div className="h-24 flex items-center justify-center bg-card rounded-md border border-dashed">
            <p className="text-xs text-muted-foreground">Record or import audio</p>
        </div>
    );
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 rounded-md cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export const Waveform = memo(WaveformComponent);
