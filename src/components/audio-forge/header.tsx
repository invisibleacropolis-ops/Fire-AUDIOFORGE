"use client";

import { Button } from '@/components/ui/button';
import { Download, Music } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface AppHeaderProps {
  onExport: () => void;
}

export function AppHeader({ onExport }: AppHeaderProps) {
  const logo = PlaceHolderImages.find(p => p.id === 'audioforge-logo');

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 shrink-0">
      <div className="flex items-center gap-3">
        {logo ? (
           <Image src={logo.imageUrl} alt={logo.description} data-ai-hint={logo.imageHint} width={32} height={32} className="rounded-md"/>
        ) : (
          <Music className="h-8 w-8 text-primary" />
        )}
        <h1 className="text-xl font-bold tracking-tight text-foreground">AudioForge</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" onClick={onExport}>
          <Download />
          Export
        </Button>
      </div>
    </header>
  );
}
