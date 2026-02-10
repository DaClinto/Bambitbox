/**
 * EXPORT PANEL COMPONENT
 * ======================
 * UI for exporting patterns to audio files (WAV/MP3).
 */

import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { AudioExporter } from '../../services/AudioExporter';
import styles from './ExportPanel.module.css';

export const ExportPanel: React.FC = () => {
    const { sequencer, audioEngine, bpm } = useApp();
    const [exporting, setExporting] = useState(false);

    /**
     * Handle WAV export.
     */
    const handleExportWAV = async () => {
        setExporting(true);

        try {
            const exporter = new AudioExporter();
            const pattern = sequencer.getPattern();
            const blob = await exporter.exportToWAV(pattern, audioEngine, bpm, 1);

            // Download file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pattern-${Date.now()}.wav`;
            a.click();
            URL.revokeObjectURL(url);

            console.log('WAV export complete');
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Make sure you have samples loaded!');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className={styles.exportPanel}>
            <span className={styles.label}>💾 Export:</span>
            <div className={styles.buttons}>
                <button
                    className={`${styles.exportButton} ${exporting ? styles.exporting : ''}`}
                    onClick={handleExportWAV}
                    disabled={exporting}
                    title="Export pattern as WAV file"
                >
                    {exporting ? '⏳ Exporting...' : '📥 WAV'}
                </button>
            </div>
        </div>
    );
};
