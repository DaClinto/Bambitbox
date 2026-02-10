/**
 * AUDIO ENGINE
 * =============
 * Core audio processing service using the Web Audio API.
 * 
 * KEY CONCEPTS:
 * -------------
 * 1. AudioContext: The main audio processing graph (like a virtual mixing desk)
 * 2. AudioBuffer: Decoded audio data stored in memory (your loaded samples)
 * 3. BufferSourceNode: One-shot audio player (created fresh for each trigger)
 * 4. Scheduling: Uses high-precision AudioContext.currentTime for sample-accurate timing
 * 
 * ARCHITECTURE:
 * ------------
 * AudioEngine is independent of React to ensure precise timing.
 * It manages:
 * - Audio context lifecycle
 * - Sample loading and caching
 * - Note scheduling with sample-accurate precision
 * - BPM calculations and timing
 */

export class AudioEngine {
    private context: AudioContext | null = null;
    private samples: Map<string, AudioBuffer> = new Map();
    private bpm: number = 120;
    private stepsPerBeat: number = 4; // 16th notes (4 steps per quarter note)

    /**
     * Initialize the audio context.
     * IMPORTANT: Must be called after a user gesture (click/tap) due to browser autoplay policies.
     */
    async initialize(): Promise<void> {
        if (this.context) return;

        // Create AudioContext (Safari uses webkitAudioContext)
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Resume context if suspended (required by some browsers)
        if (this.context.state === 'suspended') {
            await this.context.resume();
        }

        console.log('AudioEngine initialized:', this.context.sampleRate, 'Hz');
    }

    /**
     * Load an audio sample from a URL and cache it.
     * 
     * PROCESS:
     * 1. Fetch audio file as ArrayBuffer (raw binary data)
     * 2. Decode to PCM audio data (AudioBuffer)
     * 3. Cache in memory for instant playback
     * 
     * @param channelId - Unique identifier for this sample
     * @param url - File URL or data URL
     */
    async loadSample(channelId: string, url: string): Promise<void> {
        if (!this.context) {
            throw new Error('AudioEngine not initialized. Call initialize() first.');
        }

        try {
            // Fetch audio file
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

            // Cache for instant playback
            this.samples.set(channelId, audioBuffer);

            console.log(`Sample loaded: ${channelId} (${audioBuffer.duration.toFixed(2)}s)`);
        } catch (error) {
            console.error(`Failed to load sample ${channelId}:`, error);
            throw error;
        }
    }

    /**
     * Schedule a note to play at a specific time.
     * 
     * SCHEDULING STRATEGY:
     * -------------------
     * Uses AudioContext.currentTime (high-precision clock) for sample-accurate timing.
     * Each note creates a new BufferSourceNode (Web Audio API requirement).
     * 
     * @param channelId - Which sample to play
     * @param time - Absolute time in AudioContext clock (seconds)
     * @param velocity - Volume (0.0 to 1.0)
     */
    scheduleNote(channelId: string, time: number, velocity: number = 1.0): void {
        if (!this.context) {
            console.warn('Cannot schedule note: AudioEngine not initialized');
            return;
        }

        const buffer = this.samples.get(channelId);
        if (!buffer) {
            console.warn(`No sample loaded for channel: ${channelId}`);
            return;
        }

        // Create a new audio source node
        const source = this.context.createBufferSource();
        source.buffer = buffer;

        // Create a gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = velocity;

        // Connect: source → gain → destination (speakers)
        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Schedule playback at the exact time
        source.start(time);
    }

    /**
     * Calculate the duration of one step in seconds.
     * 
     * FORMULA:
     * --------
     * Step duration = 60 / (BPM × steps_per_beat)
     * 
     * Example at 120 BPM with 16th notes:
     * 60 / (120 × 4) = 0.125 seconds per step
     * 
     * @returns Duration in seconds
     */
    getStepDuration(): number {
        return 60.0 / (this.bpm * this.stepsPerBeat);
    }

    /**
     * Set the tempo.
     * 
     * @param bpm - Beats per minute (typically 60-200)
     */
    setBPM(bpm: number): void {
        this.bpm = Math.max(20, Math.min(300, bpm)); // Clamp to reasonable range
        console.log(`BPM set to: ${this.bpm}`);
    }

    /**
     * Get the current audio context time.
     * This is the high-precision clock used for scheduling.
     * 
     * @returns Current time in seconds
     */
    getCurrentTime(): number {
        return this.context?.currentTime || 0;
    }

    /**
     * Get current BPM.
     */
    getBPM(): number {
        return this.bpm;
    }

    /**
     * Check if a sample is loaded for a channel.
     */
    hasSample(channelId: string): boolean {
        return this.samples.has(channelId);
    }

    /**
     * Get the audio context (for advanced use).
     */
    getContext(): AudioContext | null {
        return this.context;
    }

    /**
     * Clean up resources.
     */
    async dispose(): Promise<void> {
        if (this.context) {
            await this.context.close();
            this.context = null;
        }
        this.samples.clear();
    }
}
