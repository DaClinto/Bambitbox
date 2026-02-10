/**
 * CHANNEL RACK COMPONENT
 * ======================
 * Main step sequencer interface (FL Studio channel rack style).
 * 
 * FEATURES:
 * --------
 * - 8 channels × 16 steps grid
 * - Click to toggle steps on/off
 * - Real-time playback position indicator
 * - Visual feedback for active and playing steps
 * - Upload samples for each channel
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * -------------------------
 * - React.memo to prevent unnecessary re-renders
 * - useCallback for event handlers
 * - CSS Grid for efficient layout
 */

import React, { useState, useCallback } from 'react';
import { useApp } from '../../contexts/AppContext';
import styles from './ChannelRack.module.css';

// Channel configuration
const CHANNELS = [
    { id: 'channel_0', name: 'Kick', color: '#ff006e' },
    { id: 'channel_1', name: 'Snare', color: '#fb5607' },
    { id: 'channel_2', name: 'Hi-Hat', color: '#ffbe0b' },
    { id: 'channel_3', name: 'Clap', color: '#8ac926' },
    { id: 'channel_4', name: 'Tom', color: '#1982c4' },
    { id: 'channel_5', name: 'Cymbal', color: '#6a4c93' },
    { id: 'channel_6', name: 'Perc 1', color: '#00d9ff' },
    { id: 'channel_7', name: 'Perc 2', color: '#9d4edd' },
];

const NUM_STEPS = 32;

export const ChannelRack: React.FC = () => {
    const { sequencer, currentStep, audioEngine } = useApp();
    const [loadedSamples, setLoadedSamples] = useState<Set<string>>(new Set());

    /**
     * Toggle a step on/off.
     */
    const handleStepClick = useCallback((channelIndex: number, stepIndex: number) => {
        sequencer.toggleStep(channelIndex, stepIndex);
        // Force re-render to show updated pattern
        setLoadedSamples(new Set(loadedSamples));
    }, [sequencer, loadedSamples]);

    /**
     * Handle file upload for a channel.
     */
    const handleFileUpload = useCallback(async (channelId: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const url = URL.createObjectURL(file);
            await audioEngine.loadSample(channelId, url);
            URL.revokeObjectURL(url); // Clean up memory

            setLoadedSamples(prev => new Set(prev).add(channelId));
            console.log(`Loaded sample for ${channelId}`);
        } catch (error) {
            console.error('Failed to load sample:', error);
            alert('Failed to load sample. Please try a different file.');
        }
    }, [audioEngine]);

    /**
     * Get the current pattern from the sequencer.
     */
    const pattern = sequencer.getPattern();

    return (
        <div className={styles.channelRack}>
            <div className={styles.header}>
                <h2 className={styles.title}>Channel Rack</h2>
                <p className={styles.subtitle}>
                    Click steps to create patterns, upload samples to each channel
                </p>
            </div>

            <div className={styles.grid}>
                {CHANNELS.map((channel, channelIndex) => (
                    <div key={channel.id} className={styles.channel}>
                        <div className={styles.channelInfo}>
                            <div className={styles.channelName}>
                                <span
                                    className={styles.channelColor}
                                    style={{ backgroundColor: channel.color }}
                                />
                                {channel.name}
                            </div>
                            <label className={styles.channelStatus}>
                                <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => handleFileUpload(channel.id, e)}
                                    style={{ display: 'none' }}
                                />
                                <span
                                    style={{
                                        cursor: 'pointer',
                                        color: loadedSamples.has(channel.id)
                                            ? 'var(--color-success)'
                                            : 'var(--color-text-tertiary)',
                                    }}
                                    onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement)?.click()}
                                >
                                    {loadedSamples.has(channel.id) ? '✓ Loaded' : '+ Load Sample'}
                                </span>
                            </label>
                        </div>

                        <div className={styles.steps}>
                            {Array.from({ length: NUM_STEPS }).map((_, stepIndex) => {
                                const isActive = pattern[channelIndex][stepIndex] > 0;
                                const isPlaying = currentStep === stepIndex;
                                const isBeat4 = (stepIndex + 1) % 4 === 0;

                                return (
                                    <button
                                        key={stepIndex}
                                        className={`
                      ${styles.step}
                      ${isActive ? styles.stepActive : ''}
                      ${isPlaying ? styles.stepPlaying : ''}
                      ${isBeat4 ? styles.stepBeat4 : ''}
                    `}
                                        onClick={() => handleStepClick(channelIndex, stepIndex)}
                                        aria-label={`Channel ${channelIndex + 1}, Step ${stepIndex + 1}`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
