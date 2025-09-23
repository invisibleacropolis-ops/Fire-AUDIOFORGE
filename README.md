# AudioForge Developer Documentation

## Overview
AudioForge is a single-page multi-track audio workstation built with Next.js 15, React 18, TypeScript, Tailwind CSS, and Tone.js. The main interface lives in [`src/app/page.tsx`](src/app/page.tsx) and composes the audio engine hook with reusable UI components for transport controls, track editing, waveform visualization, and effects management.【F:src/app/page.tsx†L1-L90】 The application targets web-based recording, editing, and mixing of audio clips with export to WAV.

The current implementation provides a functional skeleton: tracks can be added, renamed, imported, and recorded; playback can be controlled globally or per track; selections can be trimmed; and insert effects can be configured per track.【F:src/hooks/use-audio-engine.ts†L201-L392】【F:src/components/audio-forge/track.tsx†L1-L180】【F:src/components/audio-forge/effects-panel.tsx†L1-L205】 However, many flows remain incomplete or fragile (for example, destructive editing is limited to trimming, there is no persistence, and advanced editing tools are not implemented), so further development is required before a production release.

## Technology Stack
- **Framework:** Next.js 15 with the App Router, React 18, TypeScript, Tailwind CSS.【F:package.json†L1-L44】
- **Audio Processing:** Tone.js (Players, Transport, Recorder, UserMedia, effects).【F:src/hooks/use-audio-engine.ts†L1-L724】
- **UI Toolkit:** Custom components built on Radix UI primitives and lucide-react icons (buttons, sliders, tooltips, select, cards).【F:package.json†L11-L44】【F:src/components/audio-forge/track.tsx†L1-L179】
- **State & Utilities:** Custom hooks (`useAudioEngine`, `useToast`), placeholder asset helpers, Tailwind utility helpers.【F:src/hooks/use-audio-engine.ts†L1-L724】【F:src/hooks/use-toast.ts†L1-L120】【F:src/lib/placeholder-images.ts†L1-L11】

## Project Structure
```
src/
├─ app/
│  └─ page.tsx           # Main page composing the application shell
├─ hooks/
│  ├─ use-audio-engine.ts # Core Tone.js integration & track management
│  └─ use-toast.ts        # Toast notification dispatcher
├─ components/
│  └─ audio-forge/
│     ├─ header.tsx            # Import/export header bar
│     ├─ transport-controls.tsx# Global playback & record controls
│     ├─ track-view.tsx        # Track list container
│     ├─ track.tsx             # Individual track UI & controls
│     ├─ waveform.tsx          # Canvas waveform renderer w/ selection
│     └─ effects-panel.tsx     # Effect rack for selected track
├─ lib/
│  ├─ placeholder-images.*     # Placeholder artwork metadata
│  └─ utils.ts                 # General UI helpers (class merge, etc.)
└─ docs/
   └─ blueprint.md             # Original feature/design blueprint
```

## Runtime Flow
1. `AudioForge` page mounts and initializes `useAudioEngine`, which prepares Tone.js transport, recorder, and track state.【F:src/app/page.tsx†L1-L88】【F:src/hooks/use-audio-engine.ts†L85-L166】
2. Until initialization completes, a loading indicator is rendered; once ready, the header, transport controls, track view, and effects panel are shown.【F:src/app/page.tsx†L31-L88】
3. `TrackView` lists tracks from the engine and surfaces callbacks for track CRUD, playback, trimming, recording, and selection updates.【F:src/components/audio-forge/track-view.tsx†L1-L66】
4. `Track` renders per-track controls (naming, mute/solo, transport, sliders, trim action) and includes the `Waveform` canvas for selection interactions.【F:src/components/audio-forge/track.tsx†L1-L180】【F:src/components/audio-forge/waveform.tsx†L1-L152】
5. `EffectsPanel` shows the insert chain for the currently selected track and writes effect parameter changes back into track state; the engine re-instantiates Tone.js nodes whenever track effects change.【F:src/components/audio-forge/effects-panel.tsx†L1-L205】【F:src/hooks/use-audio-engine.ts†L649-L711】

## Core Modules
### `useAudioEngine`
This hook encapsulates all audio behavior and exposes state plus callbacks consumed by the UI.【F:src/hooks/use-audio-engine.ts†L85-L724】 Key responsibilities:
- **Track lifecycle:** create, update, selection handling (`addTrack`, `updateTrack`, `setTrackSelection`). Tracks maintain Tone.Player, Tone.Channel, effect metadata, volume, pan, mute/solo flags, duration, play/record status.【F:src/hooks/use-audio-engine.ts†L201-L291】
- **Audio import:** load files into Tone.Player, compute duration, sync with the transport, and append to state while firing toasts.【F:src/hooks/use-audio-engine.ts†L251-L296】
- **Transport:** toggle/pause/resume/stop/rewind via Tone.Transport, ensuring the audio context is started on demand.【F:src/hooks/use-audio-engine.ts†L298-L333】
- **Recording:** manage a shared Tone.Recorder/Tone.UserMedia instance to capture audio globally or onto a specific track (`startRecording`, `stopRecording`, `startTrackRecording`, `stopTrackRecording`, `toggleTrackRecording`). Recorded audio is wrapped in a new Tone.Player and attached to the relevant track with metadata resets.【F:src/hooks/use-audio-engine.ts†L335-L470】
- **Track playback:** respect selection bounds, support per-track rewind/stop, and mark play-state flags so the UI can render active states.【F:src/hooks/use-audio-engine.ts†L472-L529】
- **Destructive edit:** `trimTrack` slices the loaded buffer into a new blob and replaces the player/URL, resetting selections.【F:src/hooks/use-audio-engine.ts†L530-L593】
- **Mixdown/export:** `exportProject` renders audible tracks offline (honoring mute/solo) and downloads a WAV file.【F:src/hooks/use-audio-engine.ts†L594-L661】
- **Effect routing:** Whenever tracks change, the hook re-applies volume/pan/mute, rebuilds effect nodes via `instantiateEffectNode`, and chains players through the effect graph, disposing of previous nodes to limit leaks.【F:src/hooks/use-audio-engine.ts†L663-L711】

### UI Components
- **`AppHeader`** provides import/export buttons and branding imagery.【F:src/components/audio-forge/header.tsx†L1-L47】
- **`TransportControls`** centralizes playback, stop, rewind, record, and export triggers with tooltips for discoverability.【F:src/components/audio-forge/transport-controls.tsx†L1-L65】
- **`TrackView`** manages the list layout, empty-state messaging, and add-track CTA.【F:src/components/audio-forge/track-view.tsx†L1-L66】
- **`Track`** exposes mute/solo, per-track transport controls, level/pan sliders, trim button, and record toggle, while delegating waveform rendering/selection to `Waveform`.【F:src/components/audio-forge/track.tsx†L1-L179】
- **`Waveform`** loads audio into a Tone.Buffer, draws a simplified waveform on canvas, and tracks mouse-driven time selections that feed trimming/playback bounds.【F:src/components/audio-forge/waveform.tsx†L1-L153】
- **`EffectsPanel`** lists effect instances, allows parameter tweaking via sliders, and adds/removes effects using a select dropdown.【F:src/components/audio-forge/effects-panel.tsx†L1-L205】

## Known Issues and Limitations
- **Unimplemented editing tools:** The blueprint calls for cut/copy/paste, but only trimming is wired; no clip splitting, region moving, or crossfading is available yet.【F:docs/blueprint.md†L3-L15】【F:src/hooks/use-audio-engine.ts†L530-L593】
- **No track deletion or reordering:** Tracks can be created but not removed or rearranged, so sessions accumulate unused channels over time.【F:src/components/audio-forge/track-view.tsx†L17-L64】
- **Recording UX gaps:** Input monitoring, level metering, and latency compensation are absent; recorder lifecycle assumes a single shared microphone and lacks robust permission handling beyond a toast error.【F:src/hooks/use-audio-engine.ts†L335-L470】
- **Effect processing inefficiencies:** Every track update rebuilds and disposes all effect nodes, which may pop audio or leak CPU on rapid parameter changes; there is no bypass, ordering, or preset management yet.【F:src/hooks/use-audio-engine.ts†L663-L711】
- **Waveform rendering constraints:** Only the first channel is drawn, selections assume known duration, and the canvas redraw depends on ResizeObserver with no explicit loading indicator or zooming controls.【F:src/components/audio-forge/waveform.tsx†L1-L152】
- **Export format limitations:** Offline rendering always exports a single 16-bit WAV named `AudioForge-Project.wav`; there is no progress UI, filename customization, or MP3/OGG support.【F:src/hooks/use-audio-engine.ts†L594-L661】
- **State persistence:** Projects exist only in-memory—there is no save/load, undo/redo, or collaboration integration yet. The import/export buttons are the only way to move audio in/out of the app.【F:src/components/audio-forge/header.tsx†L1-L47】【F:src/hooks/use-audio-engine.ts†L251-L296】

## Outstanding Tasks
1. Implement full clip editing (split, move, duplicate, crossfade) to satisfy the blueprint feature set and support non-destructive workflows.【F:docs/blueprint.md†L3-L15】
2. Add track management features: delete, reorder/drag, color coding, grouping, and visibility toggles.【F:src/components/audio-forge/track-view.tsx†L17-L64】
3. Enhance recording: offer input selection, monitoring toggle, pre-roll/count-in, latency offset, and visual meters.【F:src/hooks/use-audio-engine.ts†L335-L470】
4. Persist sessions (e.g., local storage, IndexedDB, or backend) and implement undo/redo history for edits and parameter tweaks.【F:src/hooks/use-audio-engine.ts†L201-L593】
5. Optimize effects processing with stable node graphs, effect bypass switches, drag-to-reorder, and CPU-friendly parameter automation.【F:src/components/audio-forge/effects-panel.tsx†L93-L205】【F:src/hooks/use-audio-engine.ts†L663-L711】
6. Expand export pipeline to support multiple formats/sample rates, provide progress feedback, and allow naming/location prompts.【F:src/hooks/use-audio-engine.ts†L594-L661】
7. Improve waveform UX: multi-channel rendering, zoom/scroll, snapping to grid/tempo, selection handles, and visual playback cursors.【F:src/components/audio-forge/waveform.tsx†L1-L152】
8. Harden error handling and resource cleanup (e.g., revoke object URLs on trim/export, guard against multiple recorder starts, handle Tone.js disposal on navigation).【F:src/hooks/use-audio-engine.ts†L107-L199】【F:src/hooks/use-audio-engine.ts†L530-L661】
9. Create automated tests (unit/integration) for audio engine logic and UI interactions, as none currently exist.【F:package.json†L5-L18】

## Development Workflow
1. **Install dependencies:** `npm install`
2. **Run the dev server:** `npm run dev` (Turbopack, defaults to port 9002).【F:package.json†L5-L13】
3. **Lint and type-check:** `npm run lint` and `npm run typecheck` to ensure code quality.【F:package.json†L5-L18】
4. **Build for production:** `npm run build` followed by `npm run start`.

## Testing Status
There are currently no automated tests. Run `npm run lint` and `npm run typecheck` before committing changes to catch regressions early.【F:package.json†L5-L18】 Future work should introduce Jest/React Testing Library coverage for UI components and targeted integration tests for `useAudioEngine`.
