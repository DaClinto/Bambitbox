// Type definitions for the DAW application

/**
 * PATTERN STRUCTURE
 * -----------------
 * A Pattern is a 2D array representing the step sequencer grid:
 * - First dimension: channels (instruments/samples)
 * - Second dimension: steps (time divisions, typically 16)
 * - Value: velocity (0 = inactive, 0.01-1.0 = active with volume)
 * 
 * Example: pattern[0][4] = 0.8 means channel 0 plays at step 4 with 80% velocity
 */
export type Pattern = number[][];

/**
 * CHANNEL CONFIGURATION
 * ---------------------
 * Represents a single instrument/sample channel in the sequencer
 */
export interface Channel {
  id: string;           // Unique identifier (e.g., "kick", "snare")
  name: string;         // Display name
  sample?: AudioBuffer; // Loaded audio sample (decoded PCM data)
  color: string;        // UI color for visual distinction
}

/**
 * SEQUENCER STATE
 * ---------------
 * Complete state of the step sequencer
 */
export interface SequencerState {
  pattern: Pattern;       // 2D array of step data
  currentStep: number;    // Current playback position (0-15 for 16 steps)
  isPlaying: boolean;     // Transport state
  bpm: number;           // Tempo in beats per minute
  loop: boolean;         // Whether to loop the pattern
  channels: Channel[];   // Channel configurations
}

/**
 * AUDIO ENGINE EVENTS
 * -------------------
 * Callback types for audio engine events
 */
export type StepCallback = (step: number) => void;
export type LoadCallback = (channelId: string) => void;

/**
 * NOTE EVENT (For MIDI Recording)
 * --------------------------------
 * Represents a single recorded note with timing and pitch information
 */
export interface NoteEvent {
  id: string;              // Unique identifier
  pitch: number;           // MIDI note number (0-127)
  startTime: number;       // Start time in beats (musical time)
  duration: number;        // Note length in beats
  velocity: number;        // Note velocity (0-1)
  quantized?: boolean;     // Whether this note was quantized
  originalTime?: number;   // Original timing before quantization
}

/**
 * RECORDED TRACK
 * --------------
 * Collection of recorded notes with metadata
 */
export interface RecordedTrack {
  id: string;
  name: string;
  notes: NoteEvent[];
  bpm: number;             // BPM when recorded
  waveform: OscillatorType;
  created: Date;
}

/**
 * RECORDING STATE
 * ---------------
 * Enum for transport and recording modes
 */
export const TransportState = {
  STOPPED: 'stopped',
  PLAYING: 'playing',
  RECORDING: 'recording',
} as const;
export type TransportState = typeof TransportState[keyof typeof TransportState];

export const RecordMode = {
  LIVE: 'live',           // Just play, no recording
  RECORD: 'record',       // Record new notes (replace existing)
  OVERDUB: 'overdub',     // Add new notes to existing
} as const;
export type RecordMode = typeof RecordMode[keyof typeof RecordMode];

export const QuantizeMode = {
  NONE: 'none',           // No quantization
  QUARTER: '1/4',         // Quarter note grid
  EIGHTH: '1/8',          // Eighth note grid
  SIXTEENTH: '1/16',      // Sixteenth note grid
  THIRTYSECOND: '1/32',   // Thirty-second note grid
} as const;
export type QuantizeMode = typeof QuantizeMode[keyof typeof QuantizeMode];
