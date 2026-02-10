/**
 * TIME CONVERTER UTILITY
 * ======================
 * Convert between musical time (beats) and real time (seconds).
 * Essential for BPM-independent note storage and accurate playback.
 * 
 * WHY USE BEATS?
 * --------------
 * - BPM changes don't affect stored note positions
 * - Easy to display on piano roll (grid-aligned)
 * - Compatible with MIDI export
 * - Quantization works naturally in beat units
 * 
 * EXAMPLE:
 * --------
 * At 120 BPM, 1 beat = 0.5 seconds
 * At 60 BPM, 1 beat = 1 second
 * But the note is stored as "2 beats from start" regardless
 */

export class TimeConverter {
    private bpm: number;

    constructor(bpm: number) {
        this.bpm = bpm;
    }

    /**
     * Update BPM (for tempo changes).
     */
    setBPM(bpm: number): void {
        this.bpm = bpm;
    }

    /**
     * Convert beats to seconds.
     * Formula: seconds = (beats * 60) / BPM
     * 
     * @param beats - Musical time in beats
     * @returns Real time in seconds
     */
    beatsToSeconds(beats: number): number {
        return (beats * 60) / this.bpm;
    }

    /**
     * Convert seconds to beats.
     * Formula: beats = (seconds * BPM) / 60
     * 
     * @param seconds - Real time in seconds
     * @returns Musical time in beats
     */
    secondsToBeats(seconds: number): number {
        return (seconds * this.bpm) / 60;
    }

    /**
     * Get current beat position relative to a start time.
     * 
     * @param currentTime - Current AudioContext time
     * @param startTime - Recording/playback start time
     * @returns Current beat position
     */
    getCurrentBeat(currentTime: number, startTime: number): number {
        const elapsed = currentTime - startTime;
        return this.secondsToBeats(elapsed);
    }

    /**
     * Get step number from beat position.
     * Useful for displaying which step we're on.
     * 
     * @param beat - Beat position
     * @param stepsPerBeat - How many steps in one beat (4 for 16th notes)
     * @returns Step number (0-based)
     */
    beatToStep(beat: number, stepsPerBeat: number = 4): number {
        return Math.floor(beat * stepsPerBeat);
    }

    /**
     * Get beat position from step number.
     * 
     * @param step - Step number (0-based)
     * @param stepsPerBeat - How many steps in one beat (4 for 16th notes)
     * @returns Beat position
     */
    stepToBeat(step: number, stepsPerBeat: number = 4): number {
        return step / stepsPerBeat;
    }
}
