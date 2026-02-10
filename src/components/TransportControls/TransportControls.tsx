import React, { useEffect, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import { TransportState, RecordMode, QuantizeMode } from '../../types/index';
import styles from './TransportControls.module.css';

export const TransportControls: React.FC = () => {
    const {
        sequencer,
        audioEngine,
        isPlaying,
        setIsPlaying,
        currentStep,
        isInitialized,
        initializeAudio,
        transportState,
        setTransportState,
        noteRecorder,
        recordMode,
        setRecordMode,
        quantizeMode,
        setQuantizeMode
    } = useApp();
    const [loop, setLoop] = React.useState(true);

    /**
     * Handle play/pause toggle.
     */
    const handlePlayPause = useCallback(async () => {
        if (!isInitialized) {
            await initializeAudio();
        }

        if (transportState === TransportState.PLAYING || transportState === TransportState.RECORDING) {
            sequencer.stop();
            if (transportState === TransportState.RECORDING) {
                noteRecorder.stopRecording(audioEngine.getContext().currentTime);
            }
            setTransportState(TransportState.STOPPED);
            setIsPlaying(false);
        } else {
            sequencer.play();
            setTransportState(TransportState.PLAYING);
            setIsPlaying(true);
        }
    }, [transportState, isInitialized, sequencer, setTransportState, setIsPlaying, initializeAudio, noteRecorder]);

    /**
     * Handle record toggle.
     */
    const handleRecord = useCallback(async () => {
        if (!isInitialized) {
            await initializeAudio();
        }

        if (transportState === TransportState.RECORDING) {
            // Stop recording but keep playing
            noteRecorder.stopRecording(audioEngine.getContext().currentTime);
            setTransportState(TransportState.PLAYING);
        } else {
            // Start recording (and playing if not already)
            if (transportState === TransportState.STOPPED) {
                sequencer.play();
                setIsPlaying(true);
            }

            noteRecorder.startRecording(audioEngine.getContext().currentTime, recordMode);
            setTransportState(TransportState.RECORDING);
        }
    }, [transportState, isInitialized, sequencer, setTransportState, setIsPlaying, initializeAudio, noteRecorder, recordMode]);

    /**
     * Handle stop button.
     */
    const handleStop = useCallback(() => {
        sequencer.stop();
        if (transportState === TransportState.RECORDING) {
            noteRecorder.stopRecording(audioEngine.getContext().currentTime);
        }
        setTransportState(TransportState.STOPPED);
        setIsPlaying(false);
    }, [sequencer, transportState, setTransportState, setIsPlaying, noteRecorder, audioEngine]);

    /**
     * Handle loop toggle.
     */
    const handleLoopToggle = useCallback(() => {
        const newLoop = !loop;
        setLoop(newLoop);
        sequencer.setLoop(newLoop);
    }, [loop, sequencer]);

    /**
     * Keyboard shortcuts.
     */
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Spacebar for play/pause
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                handlePlayPause();
            }
            // 'R' for record
            if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && e.target === document.body) {
                e.preventDefault();
                handleRecord();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handlePlayPause, handleRecord]);

    return (
        <div className={styles.transport}>
            <div className={styles.controlsGroup}>
                {/* Mode Select */}
                <select
                    className={styles.select}
                    value={recordMode}
                    onChange={(e) => setRecordMode(e.target.value as RecordMode)}
                    title="Recording Mode"
                >
                    <option value={RecordMode.LIVE}>Live</option>
                    <option value={RecordMode.RECORD}>Record</option>
                    <option value={RecordMode.OVERDUB}>Overdub</option>
                </select>

                {/* Quantize Select */}
                <select
                    className={styles.select}
                    value={quantizeMode}
                    onChange={(e) => {
                        const mode = e.target.value as QuantizeMode;
                        setQuantizeMode(mode);
                        noteRecorder.setQuantizeMode(mode);
                    }}
                    title="Quantization Grid"
                >
                    <option value={QuantizeMode.NONE}>Off</option>
                    <option value={QuantizeMode.QUARTER}>1/4</option>
                    <option value={QuantizeMode.EIGHTH}>1/8</option>
                    <option value={QuantizeMode.SIXTEENTH}>1/16</option>
                    <option value={QuantizeMode.THIRTYSECOND}>1/32</option>
                </select>
            </div>

            <div className={styles.separator} />

            {/* Loop Toggle */}
            <button
                className={`${styles.button} ${styles.loopButton} ${loop ? styles.active : ''}`}
                onClick={handleLoopToggle}
                title="Toggle loop (L)"
            >
                <span className={styles.icon}>🔁</span>
            </button>

            {/* Stop Button */}
            <button
                className={`${styles.button} ${styles.stopButton}`}
                onClick={handleStop}
                disabled={transportState === TransportState.STOPPED}
                title="Stop"
            >
                <span className={styles.icon}>⏹</span>
            </button>

            {/* Play/Pause Button */}
            <button
                className={`${styles.button} ${styles.playButton} ${transportState === TransportState.PLAYING ? styles.active : ''}`}
                onClick={handlePlayPause}
                title="Play/Pause (Space)"
            >
                <span className={styles.icon}>{transportState === TransportState.PLAYING ? '⏸' : '▶'}</span>
            </button>

            {/* Record Button */}
            <button
                className={`${styles.button} ${styles.recordButton} ${transportState === TransportState.RECORDING ? styles.active : ''}`}
                onClick={handleRecord}
                title="Record (R)"
            >
                <span className={styles.icon}>●</span>
            </button>

            {/* Current Step Display */}
            <div className={styles.info}>
                <span className={styles.infoLabel}>Step</span>
                <span className={styles.infoValue}>
                    {currentStep >= 0 ? currentStep + 1 : '-'}
                </span>
            </div>
        </div>
    );
};
