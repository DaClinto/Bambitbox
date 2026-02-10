/**
 * TOP BAR COMPONENT
 * =================
 * Application header with branding and BPM control.
 */

import React from 'react';
import { useApp } from '../../contexts/AppContext';
import { ExportPanel } from '../ExportPanel/ExportPanel';
import styles from './TopBar.module.css';

export const TopBar: React.FC = () => {
    const { bpm, setBPM } = useApp();

    const handleBPMChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBPM(parseInt(e.target.value, 10));
    };

    return (
        <div className={styles.topBar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>🎵</div>
                <h1 className={styles.appName}>DAW Studio</h1>
            </div>

            <div className={styles.controls}>
                <ExportPanel />
                <div className={styles.bpmControl}>
                    <span className={styles.bpmLabel}>BPM</span>
                    <span className={styles.bpmValue}>{bpm}</span>
                    <input
                        type="range"
                        min="60"
                        max="200"
                        value={bpm}
                        onChange={handleBPMChange}
                        className={styles.bpmSlider}
                        title="Adjust tempo"
                    />
                </div>
            </div>
        </div>
    );
};
