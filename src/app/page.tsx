import { AudioForgeApp } from '@/components/audio-forge/audio-forge-app';

/**
 * Server component entrypoint that hosts the AudioForge UI.
 *
 * Rendering the interactive client experience through {@link AudioForgeApp}
 * lets Next.js keep dynamic route params and search params as async values,
 * which sidesteps the synchronous access warnings emitted by Next 15 while
 * preserving the existing user experience.
 */
export default function Page() {
  return <AudioForgeApp />;
}
