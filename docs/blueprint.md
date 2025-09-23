# **App Name**: AudioForge

## Core Features:

- Audio Recording/Import: Record audio directly within the app or import audio files from local storage.
- Audio Editing: Cut, copy, paste, and trim audio segments with precision.
- Open Source Audio Effects: Apply a wide range of open-source audio effects such as reverb, delay, echo, distortion, chorus, flanger, phaser, and more to audio clips.
- Multi-Track Support: Support for layering and mixing multiple audio tracks.
- Export: Export the final edited audio in common file formats (e.g., MP3, WAV).

## Architecture Overview

- **Audio engine hook (`useAudioEngine`)** orchestrates Tone.js lifecycle concerns. The hook holds onto ref-backed Player, Channel, and Effect nodes, exposing imperative handlers for import, trim, loop, transport, and export actions. React state mirrors the serializable portions of a track so UI can render deterministically while Tone.js nodes live outside the render cycle.
- **Transport loop** leverages `requestAnimationFrame` to translate `Tone.now()` deltas into UI playhead updates. Looping is configured per track via selection metadata, so toggling loop/selection in the UI immediately reprograms Tone.Player `loopStart`/`loopEnd` values.
- **Effect pipeline** treats each effect as a JSON descriptor. UI changes mutate descriptors; the engine re-instantiates Tone nodes and chains them `player -> effects[] -> channel` whenever track state mutates. Exporting uses the same descriptors to recreate the graph inside `Tone.Offline` for deterministic renders.
- **Recording flow** reuses a shared `Tone.Recorder` bound to `Tone.UserMedia`. Stopping a take converts the Blob into an object URL, spins up a synced Player, and swaps it into the target track.

## UI-to-Engine Interaction

- **Track strips** emit `onUpdate`, `onPlayPause`, `onSelectionChange`, and similar callbacks. Those handlers call back into the audio hook to mutate Channel settings, trigger Player scheduling, or reset loop ranges.
- **Waveform canvas** normalizes drag gestures into `{start, end}` selections expressed in seconds. The engine reads the range to drive trimming, looping, and export bounds.
- **Effects panel** directly edits the track's effect descriptors. Changes propagate through React state so the engine can rebuild the Tone.js chain and keep offline exports in sync with the live mix.
- **Transport controls** invoke the hook's master transport commands (`playFromStart`, `pausePlayback`, `stopPlayback`, `rewind`, `exportProject`), ensuring Tone's AudioContext is started in response to user gestures.

## Style Guidelines:

- Primary color: Deep purple (#673AB7) to evoke a sense of professionalism and creativity.
- Background color: Dark gray (#303030) to ensure excellent contrast and focus on the audio waveforms.
- Accent color: Electric green (#7CFC00) to highlight interactive elements and audio waveforms.
- Body and headline font: 'Inter', a sans-serif font, to maintain a clean and modern aesthetic.
- Use clean, minimalist icons representing audio editing functions (cut, paste, effects, etc.).
- Arrange audio editing tools and tracks in an intuitive layout.
- Incorporate smooth transitions when applying effects or adjusting audio levels.
