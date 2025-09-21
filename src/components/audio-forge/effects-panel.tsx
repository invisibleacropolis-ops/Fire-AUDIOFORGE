"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Track, Effect, EffectType } from '@/hooks/use-audio-engine';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

interface EffectsPanelProps {
  track: Track | null;
  onTrackUpdate: (id: string, updates: Partial<Track>) => void;
}

const effectTypes: EffectType[] = ['reverb', 'delay', 'distortion', 'chorus', 'flanger', 'phaser'];

function EffectControls({ effect, onUpdate, onRemove }: { effect: Effect, onUpdate: (id: string, params: any) => void, onRemove: (id: string) => void }) {
    const handleWetChange = (value: number[]) => {
        onUpdate(effect.id, { wet: value[0] });
    };

    return (
        <Card className="bg-muted/50">
            <CardHeader className="p-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base capitalize">{effect.type}</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(effect.id)}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                    <Label className="text-xs">Wet/Dry</Label>
                    <Slider value={[effect.wet]} onValueChange={handleWetChange} max={1} min={0} step={0.01} />
                </div>
            </CardContent>
        </Card>
    );
}

export function EffectsPanel({ track, onTrackUpdate }: EffectsPanelProps) {
    if (!track) {
        return (
            <aside className="w-80 border-l border-border p-4 flex items-center justify-center">
                <p className="text-muted-foreground text-center">Select a track to view and edit its effects.</p>
            </aside>
        );
    }
    
    const handleAddEffect = (effectType: EffectType) => {
        const newEffect: Effect = {
            id: `${effectType}-${Date.now()}`,
            type: effectType,
            wet: 0.5,
            node: null
        };
        onTrackUpdate(track.id, { effects: [...track.effects, newEffect] });
    };

    const handleUpdateEffect = (effectId: string, params: any) => {
        const updatedEffects = track.effects.map(e => e.id === effectId ? { ...e, ...params } : e);
        onTrackUpdate(track.id, { effects: updatedEffects });
    };
    
    const handleRemoveEffect = (effectId: string) => {
        const updatedEffects = track.effects.filter(e => e.id !== effectId);
        onTrackUpdate(track.id, { effects: updatedEffects });
    };

    return (
        <aside className="w-80 border-l border-border p-4 flex flex-col gap-4">
            <div className="flex-shrink-0">
                <h2 className="text-lg font-semibold">Effects: {track.name}</h2>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto">
                {track.effects.map(effect => (
                    <EffectControls key={effect.id} effect={effect} onUpdate={handleUpdateEffect} onRemove={handleRemoveEffect} />
                ))}
            </div>
            <div className="flex-shrink-0">
                <Select onValueChange={(value: EffectType) => handleAddEffect(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Add an effect..." />
                    </SelectTrigger>
                    <SelectContent>
                        {effectTypes.map(type => (
                            <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </aside>
    );
}
