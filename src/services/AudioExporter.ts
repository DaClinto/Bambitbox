/**
 * AUDIO EXPORTER SERVICE
 * ======================
 * Export patterns to audio files (WAV/MP3) using OfflineAudioContext.
 * 
 * FEATURES:
 * --------
 * - Render pattern to audio offline (faster than real-time)
 * - WAV export (lossless, larger file size)
 * - MP3 export (compressed, smaller file size)
 * - Configurable length (bars/loops)
 * 
 * HOW IT WORKS:
 * ------------
 * 1. Create OfflineAudioContext (for non-real-time rendering)
 * 2. Schedule all notes from the pattern
 * 3. Render audio buffer
 * 4. Convert to WAV/MP3 format
 * 5. Download as file
 */

import type { Pattern } from '../types/index';
import { AudioEngine } from './AudioEngine';

export class AudioExporter {
    /**
     * Export pattern to WAV file.
     * 
     * @param pattern - Pattern to export
     * @param audioEngine - Audio engine with loaded samples
     * @param bpm - Tempo
     * @param bars - Number of times to loop the pattern (default: 1)
     * @returns WAV Blob
     */
    async exportToWAV(
        pattern: Pattern,
        audioEngine: AudioEngine,
        bpm: number,
        bars: number = 1
    ): Promise<Blob> {
        const sampleRate = 44100;
        const numSteps = pattern[0].length;
        const stepDuration = (60 / bpm) / 4; // 16th note duration
        const duration = numSteps * stepDuration * bars;

        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(
            2, // stereo
            Math.ceil(duration * sampleRate),
            sampleRate
        );

        // Schedule all notes
        for (let bar = 0; bar < bars; bar++) {
            for (let step = 0; step < numSteps; step++) {
                for (let channel = 0; channel < pattern.length; channel++) {
                    const velocity = pattern[channel][step];

                    if (velocity > 0 && audioEngine.hasSample(`channel_${channel}`)) {
                        const time = (bar * numSteps + step) * stepDuration;
                        this.scheduleSample(
                            offlineContext,
                            audioEngine,
                            `channel_${channel}`,
                            time,
                            velocity
                        );
                    }
                }
            }
        }

        // Render audio
        const renderedBuffer = await offlineContext.startRendering();

        // Convert to WAV
        return this.audioBufferToWav(renderedBuffer);
    }

    /**
     * Schedule a sample in offline context.
     */
    private scheduleSample(
        context: OfflineAudioContext,
        audioEngine: AudioEngine,
        channelId: string,
        time: number,
        velocity: number
    ): void {
        // Get the cached sample from AudioEngine
        const buffer = (audioEngine as any).samples.get(channelId);
        if (!buffer) return;

        const source = context.createBufferSource();
        source.buffer = buffer;

        const gainNode = context.createGain();
        gainNode.gain.value = velocity;

        source.connect(gainNode);
        gainNode.connect(context.destination);

        source.start(time);
    }

    /**
     * Convert AudioBuffer to WAV Blob.
     */
    private audioBufferToWav(buffer: AudioBuffer): Blob {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const data = this.interleave(buffer);
        const dataLength = data.length * bytesPerSample;
        const bufferLength = 44 + dataLength;

        const arrayBuffer = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuffer);

        // WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // fmt chunk size
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true); // byte rate
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true);

        // Write samples
        this.floatTo16BitPCM(view, 44, data);

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    /**
     * Interleave multi-channel audio.
     */
    private interleave(buffer: AudioBuffer): Float32Array {
        const numChannels = buffer.numberOfChannels;
        const length = buffer.length * numChannels;
        const result = new Float32Array(length);

        const channels: Float32Array[] = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 0;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                result[offset++] = channels[channel][i];
            }
        }

        return result;
    }

    /**
     * Write string to DataView.
     */
    private writeString(view: DataView, offset: number, string: string): void {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Convert float samples to 16-bit PCM.
     */
    private floatTo16BitPCM(view: DataView, offset: number, input: Float32Array): void {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }
}
