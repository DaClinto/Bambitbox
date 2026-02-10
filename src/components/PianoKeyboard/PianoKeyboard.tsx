/**
 * PIANO KEYBOARD COMPONENT
 * ========================
 * Interactive virtual piano keyboard for real-time melodic playback.
 * 
 * FEATURES:
 * --------
 * - Visual piano keys (white + black)
 * - Computer keyboard mapping (ASDFGHJ... for white keys, WETYU... for black keys)
 * - Mouse click support
 * - Multiple octaves
 * - Wave form selection (sine, triangle, square, sawtooth)
 * - Real-time visual feedback
 * 
 * KEYBOARD MAPPING:
 * ----------------
 * White keys: A S D F G H J K (C D E F G A B C)
 * Black keys: W E   T Y U   (C# D# F# G# A#)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TransportState } from '../../types/index';
import styles from './PianoKeyboard.module.css';

// Keyboard to MIDI note mapping (starts at C4 = 60)
const KEYBOARD_MAP: { [key: string]: number } = {
    // White keys (C major scale)
    'KeyA': 0,  // C
    'KeyS': 2,  // D
    'KeyD': 4,  // E
    'KeyF': 5,  // F
    'KeyG': 7,  // G
    'KeyH': 9,  // A
    'KeyJ': 11, // B
    'KeyK': 12, // C (next octave)

    // Black keys (sharps)
    'KeyW': 1,  // C#
    'KeyE': 3,  // D#
    'KeyT': 6,  // F#
    'KeyY': 8,  // G#
    'KeyU': 10, // A#
};

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Piano layout (one octave: 12 semitones)
const OCTAVE_NOTES = [
    { note: 0, isBlack: false, name: 'C' },
    { note: 1, isBlack: true, name: 'C#' },
    { note: 2, isBlack: false, name: 'D' },
    { note: 3, isBlack: true, name: 'D#' },
    { note: 4, isBlack: false, name: 'E' },
    { note: 5, isBlack: false, name: 'F' },
    { note: 6, isBlack: true, name: 'F#' },
    { note: 7, isBlack: false, name: 'G' },
    { note: 8, isBlack: true, name: 'G#' },
    { note: 9, isBlack: false, name: 'A' },
    { note: 10, isBlack: true, name: 'A#' },
    { note: 11, isBlack: false, name: 'B' },
];

export const PianoKeyboard: React.FC = () => {
    const { synthesizer, isInitialized, initializeAudio, noteRecorder, transportState } = useApp();
    const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
    const [octave, setOctave] = useState<number>(4); // C4 (middle C)
    const [waveform, setWaveform] = useState<OscillatorType>('triangle');
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    /**
     * Handle note on (start playing)
     */
    const handleNoteOn = useCallback(async (midiNote: number) => {
        if (!isInitialized) {
            await initializeAudio();
        }

        if (synthesizer && !activeNotes.has(midiNote)) {
            synthesizer.playNote(midiNote, 0.7);
            setActiveNotes(prev => new Set(prev).add(midiNote));

            // Record if recording
            if (transportState === TransportState.RECORDING && noteRecorder) {
                noteRecorder.onNoteOn(midiNote, 0.7, synthesizer.getContext().currentTime);
            }
        }
    }, [synthesizer, activeNotes, isInitialized, initializeAudio, transportState, noteRecorder]);

    /**
     * Handle note off (stop playing)
     */
    const handleNoteOff = useCallback((midiNote: number) => {
        if (synthesizer && activeNotes.has(midiNote)) {
            synthesizer.stopNote(midiNote);
            setActiveNotes(prev => {
                const next = new Set(prev);
                next.delete(midiNote);
                return next;
            });

            // Record note off
            if (transportState === TransportState.RECORDING && noteRecorder) {
                noteRecorder.onNoteOff(midiNote, synthesizer.getContext().currentTime);
            }
        }
    }, [synthesizer, activeNotes, transportState, noteRecorder]);

    /**
     * Keyboard event handlers
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent repeat events
            if (e.repeat || pressedKeys.has(e.code)) return;

            // Handle octave shifts
            if (e.code === 'KeyZ') {
                setOctave(prev => Math.max(0, prev - 1));
                return;
            }
            if (e.code === 'KeyX') {
                setOctave(prev => Math.min(8, prev + 1));
                return;
            }

            // Handle piano keys
            const noteOffset = KEYBOARD_MAP[e.code];
            if (noteOffset !== undefined) {
                const midiNote = octave * 12 + noteOffset;
                handleNoteOn(midiNote);
                setPressedKeys(prev => new Set(prev).add(e.code));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const noteOffset = KEYBOARD_MAP[e.code];
            if (noteOffset !== undefined) {
                const midiNote = octave * 12 + noteOffset;
                handleNoteOff(midiNote);
                setPressedKeys(prev => {
                    const next = new Set(prev);
                    next.delete(e.code);
                    return next;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [octave, handleNoteOn, handleNoteOff, pressedKeys]);

    /**
     * Change waveform
     */
    const handleWaveformChange = (newWaveform: OscillatorType) => {
        setWaveform(newWaveform);
        if (synthesizer) {
            synthesizer.setWaveform(newWaveform);
        }
    };

    /**
     * Render piano octaves
     */
    const renderOctaves = () => {
        const octaves = [octave - 1, octave, octave + 1].filter(o => o >= 0 && o <= 8);

        return octaves.map(oct => (
            <div key={oct} className={styles.octave}>
                {/* White keys first (for layering) */}
                {OCTAVE_NOTES.filter(n => !n.isBlack).map(({ note, name }) => {
                    const midiNote = oct * 12 + note;
                    const isActive = activeNotes.has(midiNote);

                    return (
                        <button
                            key={midiNote}
                            className={`${styles.key} ${styles.white} ${isActive ? styles.active : ''}`}
                            onMouseDown={() => handleNoteOn(midiNote)}
                            onMouseUp={() => handleNoteOff(midiNote)}
                            onMouseLeave={() => handleNoteOff(midiNote)}
                            aria-label={`${name}${oct}`}
                        >
                            {oct === octave && name}
                        </button>
                    );
                })}

                {/* Black keys on top */}
                {OCTAVE_NOTES.filter(n => n.isBlack).map(({ note }) => {
                    const midiNote = oct * 12 + note;
                    const isActive = activeNotes.has(midiNote);

                    return (
                        <button
                            key={midiNote}
                            className={`${styles.key} ${styles.black} ${isActive ? styles.active : ''}`}
                            onMouseDown={() => handleNoteOn(midiNote)}
                            onMouseUp={() => handleNoteOff(midiNote)}
                            onMouseLeave={() => handleNoteOff(midiNote)}
                            aria-label={`${NOTE_NAMES[note]}${oct}`}
                        />
                    );
                })}
            </div>
        ));
    };

    return (
        <div className={styles.keyboard}>
            <div className={styles.header}>
                <h2 className={styles.title}>🎹 Live Piano</h2>
                <p className={styles.subtitle}>
                    Play melodies and chords in real-time • FL Keys style
                </p>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                {/* Waveform selector */}
                <div className={styles.waveformSelector}>
                    <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem', marginRight: '8px' }}>
                        Wave:
                    </span>
                    {(['sine', 'triangle', 'square', 'sawtooth'] as OscillatorType[]).map(wave => (
                        <button
                            key={wave}
                            className={`${styles.waveformButton} ${waveform === wave ? styles.active : ''}`}
                            onClick={() => handleWaveformChange(wave)}
                        >
                            {wave}
                        </button>
                    ))}
                </div>

                {/* Octave display */}
                <div className={styles.octaveLabel}>
                    <span>Octave:</span>
                    <span className={styles.octaveValue}>C{octave}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                        (Z/X to shift)
                    </span>
                </div>
            </div>

            {/* Piano keys */}
            <div className={styles.pianoContainer}>
                {renderOctaves()}
            </div>

            {/* Keyboard hints */}
            <div className={styles.hint}>
                <div className={styles.hintTitle}>⌨️ Keyboard Shortcuts</div>
                <div className={styles.hintText}>
                    <strong>White keys:</strong> A S D F G H J K (C D E F G A B C)<br />
                    <strong>Black keys:</strong> W E &nbsp; T Y U (C# D# &nbsp; F# G# A#)<br />
                    <strong>Octave:</strong> Z (down) &nbsp; X (up)
                </div>
            </div>
        </div>
    );
};
