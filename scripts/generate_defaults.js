
import fs from 'fs';
import path from 'path';

// WAV Header Generation
function writeWavHeader(sampleRate, buffer, numChannels) {
    const byteLength = buffer.length * 2; // 16-bit
    const bufferArray = new ArrayBuffer(44 + byteLength);
    const view = new DataView(bufferArray);

    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, byteLength, true);

    // Float to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }

    return Buffer.from(bufferArray);
}

const SAMPLE_RATE = 44100;

function saveWav(filename, buffer) {
    const wavBuffer = writeWavHeader(SAMPLE_RATE, buffer, 1);
    fs.writeFileSync(path.join('public', 'samples', filename), wavBuffer);
    console.log(`Generated ${filename}`);
}

// Generators
function generateKick() {
    const duration = 0.5;
    const length = SAMPLE_RATE * duration;
    const buffer = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const freq = 150 * Math.exp(-t * 8);
        const env = Math.exp(-t * 5);
        buffer[i] = Math.sin(2 * Math.PI * freq * t) * env;
    }
    saveWav('kick.wav', buffer);
}

function generateSnare() {
    const duration = 0.3;
    const length = SAMPLE_RATE * duration;
    const buffer = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.exp(-t * 12);
        const tone = Math.sin(2 * Math.PI * 200 * t) * 0.3;
        const noise = (Math.random() * 2 - 1) * 0.7;
        buffer[i] = (tone + noise) * env;
    }
    saveWav('snare.wav', buffer);
}

function generateHiHat() {
    const duration = 0.1;
    const length = SAMPLE_RATE * duration;
    const buffer = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.exp(-t * 30);
        const noise = (Math.random() * 2 - 1);
        buffer[i] = noise * env * 0.3;
    }
    saveWav('hihat.wav', buffer);
}

function generateClap() {
    const duration = 0.2;
    const length = SAMPLE_RATE * duration;
    const buffer = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.exp(-t * 15);
        const noise = (Math.random() * 2 - 1);
        const burst = (Math.sin(t * 200) > 0.5) ? 1 : 0.3;
        buffer[i] = noise * env * burst * 0.5;
    }
    saveWav('clap.wav', buffer);
}

// Ensure directory exists
if (!fs.existsSync(path.join('public', 'samples'))) {
    fs.mkdirSync(path.join('public', 'samples'), { recursive: true });
}

generateKick();
generateSnare();
generateHiHat();
generateClap();
