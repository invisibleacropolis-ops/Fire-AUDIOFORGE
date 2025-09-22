
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Track, Effect, EffectType } from '@/hooks/use-audio-engine';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

interface EffectsPanelProps {
  track: Track | null;
  onTrackUpdate: (id: string, updates: Partial<Track>) => void;
}

const effectTypes: EffectType[] = ['reverb', 'delay', 'distortion', 'chorus', 'phaser', 'vibrato'];

function EffectControls({ effect, onUpdate, onRemove }: { effect: Effect, onUpdate: (id: string, params: any) => void, onRemove: (id: string) => void }) {
    const handleWetChange = (value: number[]) => {
        onUpdate(effect.id, { wet: value[0] });
    };
    
    const handleParamChange = (param: string) => (value: number[]) => {
        onUpdate(effect.id, { [param]: value[0] });
    };

    const renderParamControls = () => {
        switch(effect.type) {
            case 'reverb':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs">Decay</Label>
                            <Slider value={[effect.decay ?? 1.5]} onValueChange={handleParamChange('decay')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Pre-delay</Label>
                            <Slider value={[effect.preDelay ?? 0.01]} onValueChange={handleParamChange('preDelay')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'delay':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs">Delay Time</Label>
                            <Slider value={[effect.delayTime ?? 0.25]} onValueChange={handleParamChange('delayTime')} max={1} min={0} step={0.01} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Feedback</Label>
                            <Slider value={[effect.feedback ?? 0.5]} onValueChange={handleParamChange('feedback')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'distortion':
                return (
                    <div className="space-y-2">
                        <Label className="text-xs">Amount</Label>
                        <Slider value={[effect.distortion ?? 0.4]} onValueChange={handleParamChange('distortion')} max={1} min={0} step={0.01} />
                    </div>
                );
            case 'chorus':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs">Frequency</Label>
                            <Slider value={[effect.frequency ?? 1.5]} onValueChange={handleParamChange('frequency')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Delay Time</Label>
                            <Slider value={[effect.delayTime ?? 3.5]} onValueChange={handleParamChange('delayTime')} max={10} min={1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Depth</Label>
                            <Slider value={[effect.depth ?? 0.7]} onValueChange={handleParamChange('depth')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'phaser':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs">Frequency</Label>
                            <Slider value={[effect.frequency ?? 0.5]} onValueChange={handleParamChange('frequency')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Octaves</Label>
                            <Slider value={[effect.octaves ?? 3]} onValueChange={handleParamChange('octaves')} max={8} min={1} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Base Frequency</Label>
                            <Slider value={[effect.baseFrequency ?? 350]} onValueChange={handleParamChange('baseFrequency')} max={1000} min={100} step={10} />
                        </div>
                    </>
                );
            case 'vibrato':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs">Frequency</Label>
                            <Slider value={[effect.frequency ?? 5]} onValueChange={handleParamChange('frequency')} max={20} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Depth</Label>
                            <Slider value={[effect.depth ?? 0.1]} onValueChange={handleParamChange('depth')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            default: 
                return null;
        }
    }

    return (
        <Card className="bg-muted/50">
            <CardHeader className="p-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base capitalize">{effect.type}</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(effect.id)}>
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
                <div className="space-y-2">
                    <Label className="text-xs">Wet/Dry</Label>
                    <Slider value={[effect.wet]} onValueChange={handleWetChange} max={1} min={0} step={0.01} />
                </div>
                {renderParamControls()}
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
        let newEffect: Effect;
        switch (effectType) {
            case 'reverb':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    decay: 1.5,
                    preDelay: 0.01,
                    node: null
                };
                break;
            case 'delay':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    delayTime: 0.25,
                    feedback: 0.5,
                    node: null
                };
                break;
            case 'distortion':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    distortion: 0.4,
                    node: null
                };
                break;
            case 'chorus':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    frequency: 1.5,
                    delayTime: 3.5,
                    depth: 0.7,
                    node: null
                };
                break;
            case 'phaser':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    frequency: 0.5,
                    octaves: 3,
                    baseFrequency: 350,
                    node: null
                };
                break;
            case 'vibrato':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    frequency: 5,
                    depth: 0.1,
                    node: null
                };
                break;
            default:
                return;
        }
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
