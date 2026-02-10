/**
 * SYNTHESIZER SERVICE
 * ===================
 * Virtual synthesizer for melodic/harmonic playback using Web Audio API.
 * 
 * FEATURES:
 * ---------
 * - Oscillator-based synthesis (triangle, sine, square, sawtooth waves)
 * - ADSR envelope for realistic note shaping
 * - Polyphony (multiple notes at once)
 * - MIDI note number support
 * - Chord playback
 * 
 * USE CASES:
 * ----------
 * - Live piano keyboard performance
 * - Melodic sequences in patterns
 * - Chord progressions
 * - Bass lines and leads
 */

export class Synthesizer {
    private context: AudioContext;
    private masterGain: GainNode;
    private waveform: OscillatorType = 'triangle'; // Piano-like timbre

    // Active oscillators for note tracking
    private activeOscillators: Map<number, { osc: OscillatorNode; gain: GainNode }> = new Map();

    constructor(context: AudioContext) {
        this.context = context;

        // Master output gain
        this.masterGain = context.createGain();
        this.masterGain.gain.value = 0.3; // Overall volume
        this.masterGain.connect(context.destination);
    }

    /**
     * Play a note with ADSR envelope.
     * 
     * @param midiNote - MIDI note number (0-127, middle C = 60)
     * @param velocity - Note velocity (0-1, loudness)
     * @param duration - Note duration in seconds (for scheduled notes)
     * @param time - Optional scheduled start time
     */
    playNote(midiNote: number, velocity: number = 1.0, duration?: number, time?: number): void {
        const freq = this.midiToFrequency(midiNote);
        const t = time || this.context.currentTime;

        // Create oscillator (sound source)
        const osc = this.context.createOscillator();
        osc.type = this.waveform;
        osc.frequency.value = freq;

        // Create envelope (ADSR shaping)
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0, t);

        // Attack: 0 → peak in 10ms
        envelope.gain.linearRampToValueAtTime(velocity * 0.4, t + 0.01);

        // Decay: peak → sustain in 100ms
        envelope.gain.linearRampToValueAtTime(velocity * 0.3, t + 0.1);

        // Sustain: hold at this level (duration determines how long)
        if (duration) {
            envelope.gain.setValueAtTime(velocity * 0.3, t + duration);
            // Release: sustain → 0 in 300ms
            envelope.gain.linearRampToValueAtTime(0, t + duration + 0.3);
        }

        // Connect audio graph: oscillator → envelope → master → output
        osc.connect(envelope);
        envelope.connect(this.masterGain);

        // Start playback
        osc.start(t);

        if (duration) {
            // Auto-stop for scheduled notes
            osc.stop(t + duration + 0.3);
        } else {
            // For live notes, track for manual stopping
            this.activeOscillators.set(midiNote, { osc, gain: envelope });
        }
    }

    /**
     * Stop a currently playing note (for live keyboard).
     * 
     * @param midiNote - MIDI note number to stop
     */
    stopNote(midiNote: number): void {
        const nodes = this.activeOscillators.get(midiNote);
        if (!nodes) return;

        const now = this.context.currentTime;

        // Release envelope: current value → 0 in 200ms
        nodes.gain.gain.cancelScheduledValues(now);
        nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, now);
        nodes.gain.gain.linearRampToValueAtTime(0, now + 0.2);

        // Stop oscillator after release
        nodes.osc.stop(now + 0.2);

        // Clean up
        this.activeOscillators.delete(midiNote);
    }

    /**
     * Play a chord (multiple notes simultaneously).
     * 
     * @param midiNotes - Array of MIDI note numbers
     * @param velocity - Chord velocity
     * @param duration - Chord duration
     * @param time - Optional scheduled start time
     */
    playChord(midiNotes: number[], velocity: number = 1.0, duration?: number, time?: number): void {
        // Reduce individual note volume to prevent clipping
        const noteVelocity = velocity / Math.sqrt(midiNotes.length);
        midiNotes.forEach(note => {
            this.playNote(note, noteVelocity, duration, time);
        });
    }

    /**
     * Stop all currently playing notes.
     */
    stopAllNotes(): void {
        this.activeOscillators.forEach((_, midiNote) => {
            this.stopNote(midiNote);
        });
    }

    /**
     * Convert MIDI note number to frequency (Hz).
     * Formula: f = 440 * 2^((note - 69) / 12)
     * 
     * @param midiNote - MIDI note number (69 = A4 = 440Hz)
     * @returns Frequency in Hz
     */
    midiToFrequency(midiNote: number): number {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }

    /**
     * Change the synthesizer waveform.
     * 
     * @param waveform - Oscillator type ('sine', 'triangle', 'square', 'sawtooth')
     */
    setWaveform(waveform: OscillatorType): void {
        this.waveform = waveform;
    }

    /**
     * Set master volume.
     * 
     * @param volume - Volume level (0-1)
     */
    setVolume(volume: number): void {
        this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }

    /**
     * Get the audio context.
     */
    getContext(): AudioContext {
        return this.context;
    }
}
