
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Track, Effect, EffectType } from '@/hooks/use-audio-engine';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';

/**
 * Sidebar component that edits a track's effect stack.
 *
 * The panel converts UI gestures into mutations on the track.effects array,
 * leaving the hook to rebuild the Tone.js chain.
 */
interface EffectsPanelProps {
  track: Track | null;
  onTrackUpdate: (id: string, updates: Partial<Track>) => void;
}

const effectTypes: EffectType[] = [
    'reverb',
    'delay',
    'distortion',
    'chorus',
    'phaser',
    'vibrato',
    'autoFilter',
    'compressor',
    'bitCrusher',
    'pitchShift',
];

function EffectControls({ effect, onUpdate, onRemove }: { effect: Effect, onUpdate: (id: string, params: any) => void, onRemove: (id: string) => void }) {
    const handleWetChange = (value: number[]) => {
        // Wet slider writes through to the effect descriptor which the engine
        // converts into Tone node wet values during re-chaining.
        onUpdate(effect.id, { wet: value[0] });
    };

    const handleParamChange = (param: string) => (value: number[]) => {
        // Each param slider targets a serialized property (e.g., decay, ratio).
        onUpdate(effect.id, { [param]: value[0] });
    };

    const renderParamControls = () => {
        switch(effect.type) {
            case 'reverb':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Reverb tail length (0.1–10 seconds)">Decay (0.1–10s)</Label>
                            <Slider value={[effect.decay ?? 1.5]} onValueChange={handleParamChange('decay')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Time before the reverb starts (0–1 seconds)">Pre-delay (0–1s)</Label>
                            <Slider value={[effect.preDelay ?? 0.01]} onValueChange={handleParamChange('preDelay')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'delay':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Time between repeats (0–1 seconds)">Delay Time (0–1s)</Label>
                            <Slider value={[effect.delayTime ?? 0.25]} onValueChange={handleParamChange('delayTime')} max={1} min={0} step={0.01} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Amount of signal fed back into the delay (0–100%)">Feedback (0–100%)</Label>
                            <Slider value={[effect.feedback ?? 0.5]} onValueChange={handleParamChange('feedback')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'distortion':
                return (
                    <div className="space-y-2">
                        <Label className="text-xs" title="Distortion intensity (0–100%)">Amount (0–100%)</Label>
                        <Slider value={[effect.distortion ?? 0.4]} onValueChange={handleParamChange('distortion')} max={1} min={0} step={0.01} />
                    </div>
                );
            case 'chorus':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="LFO speed driving the chorus (0.1–10 Hz)">Frequency (0.1–10 Hz)</Label>
                            <Slider value={[effect.frequency ?? 1.5]} onValueChange={handleParamChange('frequency')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Base delay applied to the wet signal (1–10 ms)">Delay Time (1–10 ms)</Label>
                            <Slider value={[effect.delayTime ?? 3.5]} onValueChange={handleParamChange('delayTime')} max={10} min={1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Modulation depth (0–100%)">Depth (0–100%)</Label>
                            <Slider value={[effect.depth ?? 0.7]} onValueChange={handleParamChange('depth')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'phaser':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="LFO speed (0.1–10 Hz)">Frequency (0.1–10 Hz)</Label>
                            <Slider value={[effect.frequency ?? 0.5]} onValueChange={handleParamChange('frequency')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Range of the filter sweep (1–8 octaves)">Octaves (1–8)</Label>
                            <Slider value={[effect.octaves ?? 3]} onValueChange={handleParamChange('octaves')} max={8} min={1} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Starting frequency of the sweep (100–1000 Hz)">Base Frequency (100–1000 Hz)</Label>
                            <Slider value={[effect.baseFrequency ?? 350]} onValueChange={handleParamChange('baseFrequency')} max={1000} min={100} step={10} />
                        </div>
                    </>
                );
            case 'vibrato':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Modulation rate (0.1–20 Hz)">Frequency (0.1–20 Hz)</Label>
                            <Slider value={[effect.frequency ?? 5]} onValueChange={handleParamChange('frequency')} max={20} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Modulation amount (0–100%)">Depth (0–100%)</Label>
                            <Slider value={[effect.depth ?? 0.1]} onValueChange={handleParamChange('depth')} max={1} min={0} step={0.01} />
                        </div>
                    </>
                );
            case 'autoFilter':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="LFO speed modulating the filter (0.1–10 Hz)">Frequency (0.1–10 Hz)</Label>
                            <Slider value={[effect.frequency ?? 1.5]} onValueChange={handleParamChange('frequency')} max={10} min={0.1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Depth of the sweep (0–100%)">Depth (0–100%)</Label>
                            <Slider value={[effect.depth ?? 0.5]} onValueChange={handleParamChange('depth')} max={1} min={0} step={0.01} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Starting frequency of the auto filter (20–2000 Hz)">Base Frequency (20–2000 Hz)</Label>
                            <Slider value={[effect.baseFrequency ?? 200]} onValueChange={handleParamChange('baseFrequency')} max={2000} min={20} step={10} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Range of the sweep in octaves (0.1–8)">Octaves (0.1–8)</Label>
                            <Slider value={[effect.octaves ?? 2]} onValueChange={handleParamChange('octaves')} max={8} min={0.1} step={0.1} />
                        </div>
                    </>
                );
            case 'compressor':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Signal level where compression begins (-60 to 0 dB)">Threshold (-60 to 0 dB)</Label>
                            <Slider value={[effect.threshold ?? -24]} onValueChange={handleParamChange('threshold')} max={0} min={-60} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Amount of compression applied (1:1 to 20:1)">Ratio (1–20:1)</Label>
                            <Slider value={[effect.ratio ?? 12]} onValueChange={handleParamChange('ratio')} max={20} min={1} step={0.1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Time for the compressor to react (1–1000 ms)">Attack (1–1000 ms)</Label>
                            <Slider
                                value={[(effect.attack ?? 0.003) * 1000]}
                                onValueChange={(value) => {
                                    const [ms = 0] = value;
                                    onUpdate(effect.id, { attack: ms / 1000 });
                                }}
                                max={1000}
                                min={1}
                                step={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Time to release compression (10–2000 ms)">Release (10–2000 ms)</Label>
                            <Slider
                                value={[(effect.release ?? 0.25) * 1000]}
                                onValueChange={(value) => {
                                    const [ms = 0] = value;
                                    onUpdate(effect.id, { release: ms / 1000 });
                                }}
                                max={2000}
                                min={10}
                                step={10}
                            />
                        </div>
                    </>
                );
            case 'bitCrusher':
                return (
                    <div className="space-y-2">
                        <Label className="text-xs" title="Bit depth reduction (1–16 bits)">Bit Depth (1–16 bits)</Label>
                        <Slider value={[effect.bits ?? 4]} onValueChange={handleParamChange('bits')} max={16} min={1} step={1} />
                    </div>
                );
            case 'pitchShift':
                return (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Pitch offset in semitones (-12 to +12)">Pitch (-12 to +12 st)</Label>
                            <Slider value={[effect.pitch ?? 0]} onValueChange={handleParamChange('pitch')} max={12} min={-12} step={1} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Amount of pitch-shift signal fed back (0–95%)">Feedback (0–95%)</Label>
                            <Slider value={[effect.feedback ?? 0]} onValueChange={handleParamChange('feedback')} max={0.95} min={0} step={0.01} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Delay before resampling (0–1 s)">Delay Time (0–1s)</Label>
                            <Slider value={[effect.delayTime ?? 0]} onValueChange={handleParamChange('delayTime')} max={1} min={0} step={0.01} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs" title="Window size for pitch detection (30–500 ms)">Window Size (30–500 ms)</Label>
                            <Slider
                                value={[(effect.windowSize ?? 0.1) * 1000]}
                                onValueChange={(value) => {
                                    const [ms = 0] = value;
                                    onUpdate(effect.id, { windowSize: ms / 1000 });
                                }}
                                max={500}
                                min={30}
                                step={10}
                            />
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
        // Default parameter sets mirror Tone.js defaults so the engine can
        // instantiate nodes without additional mapping when the list changes.
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
            case 'autoFilter':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    frequency: 1.5,
                    depth: 0.5,
                    baseFrequency: 200,
                    octaves: 2,
                    node: null
                };
                break;
            case 'compressor':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    threshold: -24,
                    ratio: 12,
                    attack: 0.003,
                    release: 0.25,
                    node: null
                };
                break;
            case 'bitCrusher':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    bits: 4,
                    node: null
                };
                break;
            case 'pitchShift':
                newEffect = {
                    id: `${effectType}-${Date.now()}`,
                    type: effectType,
                    wet: 0.5,
                    pitch: 0,
                    feedback: 0,
                    delayTime: 0,
                    windowSize: 0.1,
                    node: null
                };
                break;
            default:
                return;
        }
        onTrackUpdate(track.id, { effects: [...track.effects, newEffect] });
    };

    const handleUpdateEffect = (effectId: string, params: any) => {
        // Persist parameter changes so useAudioEngine can rebuild the Tone node
        // graph the next time the track array changes.
        const updatedEffects = track.effects.map(e => e.id === effectId ? { ...e, ...params } : e);
        onTrackUpdate(track.id, { effects: updatedEffects });
    };

    const handleRemoveEffect = (effectId: string) => {
        // Removing an effect simply drops its descriptor; the engine cleanup
        // effect disposes the Tone node instances.
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
