/**
 * Maps narration audio timeline to the merged video timeline for caption burn.
 *
 * After Fal merges the composed (crossfaded) video with the concatenated
 * narration audio, both tracks share a single timeline. The audio for slide i
 * starts at sum(audio_dur[0..i-1]) regardless of the crossfade; captions must
 * align with the audio, not the earlier visual frame. So the correct offset is
 * simply the cumulative audio duration — no crossfade adjustment needed.
 *
 * (The crossfade only affects when you *see* the slide, not when you *hear* it.)
 */
export function captionOffsetForVideoCompose(
  audioOffsetSeconds: number,
): number {
  return audioOffsetSeconds;
}
