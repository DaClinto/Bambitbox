/**
 * MODE SWITCH COMPONENT
 * =====================
 * Toggle between Pattern Mode (step sequencer) and Live Mode (piano keyboard).
 */

import React from 'react';
import { useApp } from '../../contexts/AppContext';
import styles from './ModeSwitch.module.css';

export const ModeSwitch: React.FC = () => {
    const { mode, setMode } = useApp();

    return (
        <div className={styles.modeSwitch}>
            <div className={styles.switchContainer}>
                <button
                    className={`${styles.modeButton} ${mode === 'pattern' ? styles.active : ''}`}
                    onClick={() => setMode('pattern')}
                >
                    <span className={styles.icon}>🎛️</span>
                    <span className={styles.label}>Pattern</span>
                </button>

                <button
                    className={`${styles.modeButton} ${mode === 'live' ? styles.active : ''}`}
                    onClick={() => setMode('live')}
                >
                    <span className={styles.icon}>🎹</span>
                    <span className={styles.label}>Live</span>
                </button>
            </div>
        </div>
    );
};
