/**
 * NOTE RECORDER SERVICE
 * =====================
 * Records keyboard performances in real-time with accurate timing.
 * 
 * FEATURES:
 * ---------
 * - Real-time note capture (note on/off events)
 * - Musical time tracking (beats, not seconds)
 * - Quantization support
 * - Multiple recording modes (record, overdub)
 * - Note editing and playback
 * 
 * WORKFLOW:
 * ---------
 * 1. startRecording() - Begin capturing
 * 2. onNoteOn() - User presses key
 * 3. onNoteOff() - User releases key
 * 4. stopRecording() - Finish capturing
 * 5. getRecordedNotes() - Retrieve for playback
 */

import type { NoteEvent } from '../types/index';
import { RecordMode, QuantizeMode } from '../types/index';
import { TimeConverter } from '../utils/TimeConverter';
import { Quantizer } from '../utils/Quantizer';
import { Synthesizer } from './Synthesizer';

export class NoteRecorder {
    private recordingStartTime: number = 0;
    private recordedNotes: NoteEvent[] = [];
    private activeNotes: Map<number, Partial<NoteEvent>> = new Map();
    private timeConverter: TimeConverter;
    private quantizer: Quantizer;
    private isRecording: boolean = false;
    private recordMode: RecordMode = RecordMode.RECORD;
    private quantizeMode: QuantizeMode = QuantizeMode.SIXTEENTH;

    constructor(bpm: number = 120) {
        this.timeConverter = new TimeConverter(bpm);
        this.quantizer = new Quantizer();
    }

    /**
     * Start recording session.
     * 
     * @param currentTime - AudioContext current time
     * @param mode - Recording mode (record or overdub)
     */
    startRecording(currentTime: number, mode: RecordMode = RecordMode.RECORD): void {
        this.recordingStartTime = currentTime;
        this.isRecording = true;
        this.recordMode = mode;

        // Clear existing notes if in RECORD mode
        if (mode === RecordMode.RECORD) {
            this.recordedNotes = [];
        }

        console.log(`Recording started in ${mode} mode at ${currentTime}`);
    }

    /**
     * Stop recording session.
     * 
     * @param currentTime - AudioContext current time
     */
    stopRecording(currentTime: number): void {
        this.isRecording = false;

        // Finish any hanging notes
        this.activeNotes.forEach((_note, pitch) => {
            this.onNoteOff(pitch, currentTime);
        });

        console.log(`Recording stopped. Captured ${this.recordedNotes.length} notes`);
    }

    /**
     * Handle note on event (key press).
     * 
     * @param pitch - MIDI note number
     * @param velocity - Note velocity (0-1)
     * @param currentTime - AudioContext current time
     */
    onNoteOn(pitch: number, velocity: number, currentTime: number): void {
        if (!this.isRecording) return;

        const relativeTime = currentTime - this.recordingStartTime;
        const beat = this.timeConverter.secondsToBeats(relativeTime);

        const note: Partial<NoteEvent> = {
            id: this.generateId(),
            pitch,
            startTime: beat,
            velocity,
            duration: 0, // Will be set on note off
        };

        this.activeNotes.set(pitch, note);

        console.log(`Note ON: ${pitch} at beat ${beat.toFixed(2)}`, note);
    }

    /**
     * Handle note off event (key release).
       * 
       * @param pitch - MIDI note number
       * @param currentTime - AudioContext current time
       */
    onNoteOff(pitch: number, currentTime: number): void {
        const note = this.activeNotes.get(pitch);
        if (!note) return;

        const relativeTime = currentTime - this.recordingStartTime;
        const endBeat = this.timeConverter.secondsToBeats(relativeTime);
        note.duration = endBeat - (note.startTime || 0);

        // Ensure minimum duration
        if (note.duration < 0.05) {
            note.duration = 0.05;
        }

        // Apply quantization if enabled
        let finalNote = note as NoteEvent;
        if (this.quantizeMode !== QuantizeMode.NONE) {
            finalNote = this.quantizer.quantize(finalNote, this.quantizeMode);
        }

        this.recordedNotes.push(finalNote);
        this.activeNotes.delete(pitch);

        console.log(`Note OFF: ${pitch}, duration: ${note.duration?.toFixed(2)} beats`);
    }

    /**
     * Schedule notes for playback within a specific beat window.
     * Called by the sequencer during playback.
     * 
     * @param startBeat - Start of the window (inclusive)
     * @param endBeat - End of the window (exclusive)
     * @param startTime - AudioContext time corresponding to startBeat
     * @param synthesizer - Synthesizer instance to play notes
     */
    schedulePlayback(startBeat: number, endBeat: number, startTime: number, synthesizer: Synthesizer): void {
        // Find notes that start within this window
        const notesToPlay = this.recordedNotes.filter(note =>
            note.startTime >= startBeat && note.startTime < endBeat
        );

        notesToPlay.forEach(note => {
            // Calculate exact time offset from window start
            const beatOffset = note.startTime - startBeat;
            const timeOffset = this.timeConverter.beatsToSeconds(beatOffset);
            const noteTime = startTime + timeOffset;
            const durationSeconds = this.timeConverter.beatsToSeconds(note.duration);

            synthesizer.playNote(note.pitch, note.velocity, durationSeconds, noteTime);
        });
    }

    /**
     * Get all recorded notes.
     */
    getRecordedNotes(): NoteEvent[] {
        return this.recordedNotes;
    }

    /**
     * Clear all recorded notes.
     */
    clearNotes(): void {
        this.recordedNotes = [];
        this.activeNotes.clear();
    }

    /**
     * Delete a specific note by ID.
     */
    deleteNote(noteId: string): void {
        this.recordedNotes = this.recordedNotes.filter(n => n.id !== noteId);
    }

    /**
     * Update a note's properties.
     */
    updateNote(noteId: string, updates: Partial<NoteEvent>): void {
        const note = this.recordedNotes.find(n => n.id === noteId);
        if (note) {
            Object.assign(note, updates);
        }
    }

    /**
     * Set BPM (updates time converter).
     */
    setBPM(bpm: number): void {
        this.timeConverter.setBPM(bpm);
    }

    /**
     * Set quantize mode.
     */
    setQuantizeMode(mode: QuantizeMode): void {
        this.quantizeMode = mode;
    }

    /**
   * Get quantize mode.
   */
    getQuantizeMode(): QuantizeMode {
        return this.quantizeMode;
    }

    /**
     * Get record mode.
     */
    getRecordMode(): RecordMode {
        return this.recordMode;
    }

    /**
     * Check if currently recording.
     */
    getIsRecording(): boolean {
        return this.isRecording;
    }

    /**
     * Get note count.
     */
    getNoteCount(): number {
        return this.recordedNotes.length;
    }

    /**
     * Generate unique ID for notes.
     */
    private generateId(): string {
        return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get TimeConverter instance (for external use).
     */
    getTimeConverter(): TimeConverter {
        return this.timeConverter;
    }
}
