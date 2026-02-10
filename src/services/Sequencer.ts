/**
 * SEQUENCER SERVICE
 * =================
 * Manages pattern data, playback logic, and audio scheduling coordination.
 * 
 * KEY CONCEPTS:
 * -------------
 * 1. Pattern: 2D grid of steps [channel][step] = velocity
 * 2. Transport: Play/Stop controls and position tracking
 * 3. Look-ahead Scheduling: Schedules audio slightly ahead for perfect timing
 * 4. Quantization: Ensures steps trigger exactly on beat subdivisions
 * 
 * ARCHITECTURE:
 * ------------
 * The Sequencer bridges the gap between user interactions and audio playback:
 * - Manages pattern state (which steps are active)
 * - Runs a scheduling loop independent of React rendering
 * - Emits callbacks for UI synchronization
 * - Uses AudioEngine for actual sound playback
 */

import { AudioEngine } from './AudioEngine';
import type { Pattern, StepCallback } from '../types/index';

export class Sequencer {
    private audioEngine: AudioEngine;
    private pattern: Pattern;
    private numSteps: number;
    private numChannels: number;
    private currentStep: number = 0;
    private isPlaying: boolean = false;
    private loop: boolean = true;

    // Scheduling
    private schedulerTimer: number | null = null;
    private nextStepTime: number = 0;
    private scheduleAheadTime: number = 0.1; // Schedule 100ms ahead
    private lookAhead: number = 25; // How often to run scheduler (ms)

    // Callbacks for UI updates
    private onStepChange: StepCallback | null = null;

    // Callback for external audio scheduling (e.g. NoteRecorder)
    private onSchedule: ((step: number, time: number) => void) | null = null;

    /**
     * Create a new sequencer.
     * 
     * @param audioEngine - The audio engine instance
     * @param numChannels - Number of channels (instruments)
     * @param numSteps - Number of steps (typically 32)
     */
    constructor(audioEngine: AudioEngine, numChannels: number = 8, numSteps: number = 32) {
        this.audioEngine = audioEngine;
        this.numChannels = numChannels;
        this.numSteps = numSteps;

        // Initialize empty pattern
        this.pattern = Array(numChannels).fill(null).map(() => Array(numSteps).fill(0));
    }

    /**
     * Set or clear a step in the pattern.
     * 
     * @param channel - Channel index (0-7)
     * @param step - Step index (0-15)
     * @param velocity - Volume (0 = off, 0.01-1.0 = on with volume)
     */
    setStep(channel: number, step: number, velocity: number): void {
        if (channel >= 0 && channel < this.numChannels && step >= 0 && step < this.numSteps) {
            this.pattern[channel][step] = velocity;
        }
    }

    /**
     * Get the current pattern.
     */
    getPattern(): Pattern {
        return this.pattern;
    }

    /**
     * Toggle a step on/off.
     * 
     * @param channel - Channel index
     * @param step - Step index
     * @returns New velocity (0 or 1)
     */
    toggleStep(channel: number, step: number): number {
        const currentVelocity = this.pattern[channel][step];
        const newVelocity = currentVelocity > 0 ? 0 : 1;
        this.setStep(channel, step, newVelocity);
        return newVelocity;
    }

    /**
     * Start playback.
     * 
     * SCHEDULING STRATEGY:
     * -------------------
     * Uses a "look-ahead" pattern:
     * 1. Run scheduler every 25ms
     * 2. Schedule any notes that fall within the next 100ms
     * 3. Keep UI current step separate from scheduled notes
     * 
     * This ensures perfect timing regardless of JavaScript event loop delays.
     */
    play(): void {
        if (this.isPlaying) return;

        this.isPlaying = true;
        this.currentStep = 0;
        this.nextStepTime = this.audioEngine.getCurrentTime();

        // Start the scheduler
        this.scheduler();

        console.log('Sequencer started');
    }

    /**
     * Stop playback and reset position.
     */
    stop(): void {
        this.isPlaying = false;
        this.currentStep = 0;

        if (this.schedulerTimer !== null) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        // Notify UI of reset
        if (this.onStepChange) {
            this.onStepChange(-1); // -1 indicates stopped
        }

        console.log('Sequencer stopped');
    }

    /**
     * Scheduler loop - runs independently of React rendering.
     * 
     * ALGORITHM:
     * ---------
     * 1. Check if next step(s) fall within look-ahead window
     * 2. If yes, schedule all notes for that step
     * 3. Advance to next step
     * 4. Repeat via setTimeout
     */
    private scheduler = (): void => {
        const currentTime = this.audioEngine.getCurrentTime();

        // Schedule all steps that fall within the look-ahead window
        while (this.nextStepTime < currentTime + this.scheduleAheadTime) {
            this.scheduleStep(this.currentStep, this.nextStepTime);
            this.nextStep();
        }

        // Run scheduler again after lookAhead interval
        this.schedulerTimer = window.setTimeout(this.scheduler, this.lookAhead);
    };

    /**
     * Schedule all active notes for a specific step.
     * 
     * @param step - Which step to schedule
     * @param time - Exact time to play (in AudioContext time)
     */
    private scheduleStep(step: number, time: number): void {
        // Notify UI (runs immediately, not scheduled)
        if (this.onStepChange) {
            this.onStepChange(step);
        }

        // Notify external schedulers
        if (this.onSchedule) {
            this.onSchedule(step, time);
        }

        // Schedule audio for each channel
        for (let channel = 0; channel < this.numChannels; channel++) {
            const velocity = this.pattern[channel][step];

            if (velocity > 0) {
                // Schedule this note to play at the exact time
                this.audioEngine.scheduleNote(`channel_${channel}`, time, velocity);
            }
        }
    }

    /**
     * Advance to the next step.
     */
    private nextStep(): void {
        const stepDuration = this.audioEngine.getStepDuration();
        this.nextStepTime += stepDuration;

        this.currentStep++;

        // Loop or stop at end
        if (this.currentStep >= this.numSteps) {
            if (this.loop) {
                this.currentStep = 0;
            } else {
                this.stop();
            }
        }
    }

    /**
     * Set callback for step changes (for UI updates).
     * 
     * @param callback - Function called when current step changes
     */
    setOnStepChange(callback: StepCallback): void {
        this.onStepChange = callback;
    }

    /**
     * Set callback for audio scheduling.
     */
    setOnSchedule(callback: (step: number, time: number) => void): void {
        this.onSchedule = callback;
    }

    /**
     * Set loop mode.
     */
    setLoop(loop: boolean): void {
        this.loop = loop;
    }

    /**
     * Get current playback state.
     */
    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    /**
     * Get current step position.
     */
    getCurrentStep(): number {
        return this.currentStep;
    }

    /**
     * Clear all steps in the pattern.
     */
    clearPattern(): void {
        this.pattern = Array(this.numChannels).fill(null).map(() => Array(this.numSteps).fill(0));
    }

    /**
     * Load a pattern.
     */
    loadPattern(pattern: Pattern): void {
        if (pattern.length === this.numChannels && pattern[0].length === this.numSteps) {
            this.pattern = pattern.map(row => [...row]); // Deep copy
        } else {
            console.error('Pattern dimensions mismatch');
        }
    }
}
