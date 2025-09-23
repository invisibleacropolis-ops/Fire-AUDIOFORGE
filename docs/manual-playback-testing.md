# Master Playback Selection QA

The steps below validate that transport playback respects the user-defined selection window.

1. Load or record at least two tracks and highlight a sub-region on each track.
2. Click **Rewind** to ensure all playheads jump to the highlighted start time.
3. Press **Play** and confirm audio begins from the highlighted start rather than the clip head.
4. Toggle **Loop** for one track and verify playback continues looping only within the highlighted range.
5. Disable Looping and press **Play** again to ensure playback continues past the highlighted end into the remainder of the clip.
6. Adjust the selection start, press **Rewind**, and confirm the playhead and subsequent playback start move to the updated offset without residual audio from the previous selection.
