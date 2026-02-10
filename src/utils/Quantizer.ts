/**
 * QUANTIZER UTILITY
 * =================
 * Snap note timing to a musical grid for perfect rhythm.
 * 
 * QUANTIZATION:
 * ------------
 * Moves note start times to the nearest grid point.
 * Essential for tight, professional-sounding recordings.
 * 
 * GRID SIZES:
 * ----------
 * - 1/4 note = 1 beat
 * - 1/8 note = 0.5 beats
 * - 1/16 note = 0.25 beats (most common for drums/bass)
 * - 1/32 note = 0.125 beats (very tight)
 */

import type { NoteEvent } from '../types/index';
import { QuantizeMode } from '../types/index';

export class Quantizer {
    /**
     * Quantize a note to the specified grid.
     * 
     * @param note - Note to quantize
     * @param mode - Quantization grid size
     * @returns Quantized note
     */
    quantize(note: NoteEvent, mode: QuantizeMode): NoteEvent {
        if (mode === QuantizeMode.NONE) {
            return note;
        }

        const gridSize = this.getGridSize(mode);

        // Round start time to nearest grid point
        const quantizedStart = Math.round(note.startTime / gridSize) * gridSize;

        // Optionally quantize duration (round to grid)
        const quantizedDuration = Math.max(
            gridSize,
            Math.round(note.duration / gridSize) * gridSize
        );

        return {
            ...note,
            startTime: quantizedStart,
            duration: quantizedDuration,
            quantized: true,
            originalTime: note.startTime,
        };
    }

    /**
     * Quantize multiple notes at once.
     */
    quantizeAll(notes: NoteEvent[], mode: QuantizeMode): NoteEvent[] {
        return notes.map(note => this.quantize(note, mode));
    }

    /**
     * Get grid size in beats for a quantize mode.
     */
    private getGridSize(mode: QuantizeMode): number {
        switch (mode) {
            case QuantizeMode.QUARTER:
                return 1;           // 1 beat
            case QuantizeMode.EIGHTH:
                return 0.5;         // 1/2 beat
            case QuantizeMode.SIXTEENTH:
                return 0.25;        // 1/4 beat
            case QuantizeMode.THIRTYSECOND:
                return 0.125;       // 1/8 beat
            default:
                return 0;
        }
    }

    /**
     * Snap a beat value to the grid.
     * Useful for manual note editing.
     */
    snapToGrid(beat: number, mode: QuantizeMode): number {
        if (mode === QuantizeMode.NONE) return beat;

        const gridSize = this.getGridSize(mode);
        return Math.round(beat / gridSize) * gridSize;
    }
}
