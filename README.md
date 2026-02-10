# 🎵 Bambitbox

A lightweight, FL Studio–inspired digital audio workstation built with modern web technologies.

![DAW Studio](https://img.shields.io/badge/React-18-blue)  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-Latest-purple)

## ✨ Features

- **Step Sequencer**: 8-channel × 16-step grid for beat programming
- **BPM Control**: Adjustable tempo (60-200 BPM) with real-time updates
- **Sample Playback**: Load and play custom audio samples using Web Audio API
- **Dark Theme UI**: Clean, professional interface with glassmorphism effects
- **Real-time Visual Feedback**: See your pattern play in real-time
- **Keyboard Shortcuts**: Spacebar to play/pause
- **Loop Mode**: Continuous pattern playback

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed
- Modern web browser (Chrome, Firefox, or Safari)

### Installation

```bash
# Navigate to the project directory
cd c:/Users/tadiw/Downloads/DAW

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The app will open automatically at `http://localhost:5173`

## 🎹 How to Use

### 1. **Load Samples**

Each of the 8 channels can have one audio sample:

- Click **"+ Load Sample"** next to a channel name
- Select an audio file (.wav, .mp3, .ogg)
- The status will change to **"✓ Loaded"** when ready

**Sample Recommendations**:
- Channel 1 (Kick): Bass drum sample
- Channel 2 (Snare): Snare drum sample
- Channel 3 (Hi-Hat): Closed hi-hat sample
- Channel 4 (Clap): Hand clap sample
- Channels 5-8: Any percussion or melodic samples

### 2. **Create Patterns**

- Click on the grid cells to toggle steps on/off
- **Active steps** = Bright cyan color
- **Inactive steps** = Dark gray
- The grid has 16 steps per channel

**Visual Aids**:
- Every 4th step has a visual separator (beat markers)
- Currently playing step pulses with a pink highlight

### 3. **Adjust Tempo**

- Use the **BPM slider** in the top bar (range: 60-200)
- Changes take effect immediately, even during playback

### 4. **Control Playback**

- **▶ Play Button**: Start playback (or press Spacebar)
- **⏹ Stop Button**: Stop and return to start
- **🔁 Loop Button**: Toggle continuous looping (green when active)
- **Step Display**: Shows current playback position (1-16)

## 🏗️ Architecture

### Project Structure

```
DAW/
├── src/
│   ├── services/
│   │   ├── AudioEngine.ts       # Web Audio API management
│   │   └── Sequencer.ts         # Pattern sequencer logic
│   ├── contexts/
│   │   └── AppContext.tsx       # Global state management
│   ├── components/
│   │   ├── TopBar/              # Header with BPM control
│   │   ├── ChannelRack/         # Step sequencer grid
│   │   └── TransportControls/   # Play/stop controls
│   ├── types/
│   │   └── index.ts             # TypeScript definitions
│   ├── styles/
│   │   └── global.css           # Design tokens & base styles
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # React entry point
├── index.html                   # HTML entry point
├── vite.config.ts              # Vite configuration
└── package.json                # Dependencies
```

### Key Concepts Explained

#### **AudioEngine Service**

The `AudioEngine` is the core audio processing layer:

- **AudioContext**: The main audio graph (think of it as a virtual mixing desk)
- **AudioBuffer**: Decoded audio samples stored in memory
- **Scheduling**: Uses `AudioContext.currentTime` for sample-accurate timing
- **Sample Loading**: Fetches, decodes, and caches audio files

```typescript
// Example: Load and play a sample
await audioEngine.loadSample('kick', '/samples/kick.wav');
audioEngine.scheduleNote('kick', audioEngine.getCurrentTime(), 1.0);
```

#### **Sequencer Service**

The `Sequencer` manages pattern playback:

- **Pattern**: 2D array `[channel][step] = velocity` (0 = off, 0.01-1.0 = on)
- **Look-ahead Scheduling**: Schedules audio 100ms ahead for perfect timing
- **Transport**: Play/stop controls and position tracking
- **Quantization**: Steps trigger exactly on beat subdivisions

```typescript
// Example: Create a basic kick pattern
sequencer.setStep(0, 0, 1.0);  // Kick on step 1
sequencer.setStep(0, 4, 1.0);  // Kick on step 5
sequencer.setStep(0, 8, 1.0);  // Kick on step 9
sequencer.setStep(0, 12, 1.0); // Kick on step 13
sequencer.play();
```

#### **State Management**

React Context (`AppContext`) provides:

- Shared `AudioEngine` and `Sequencer` instances
- Global state (BPM, playing status, current step)
- Prevents prop drilling through component tree

## 🎨 Design System

### Color Palette

- **Background**: Deep grays (#0a0a0a → #1e1e1e)
- **Accent Primary**: Cyan (#00d9ff)
- **Accent Secondary**: Purple (#9d4edd)
- **Accent Tertiary**: Pink (#ff006e)

### Spacing Scale

All spacing uses an 8px base unit:
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px

## 🔧 Extending the DAW

The architecture is designed for easy extensibility:

### Adding a Piano Roll

Create a new component for melodic sequences:

```typescript
interface Note {
  pitch: number;      // MIDI note (0-127)
  start: number;      // Position in beats
  duration: number;   // Length in beats
  velocity: number;   // Volume (0-1)
}
```

Use `OscillatorNode` or sampled instruments for playback.

### Adding Mixer Channels

Insert effect nodes between samples and output:

```typescript
class ChannelStrip {
  gainNode: GainNode;           // Volume control
  pannerNode: StereoPannerNode; // Stereo panning
  // Add effects here (reverb, delay, etc.)
}
```

### Adding Audio Effects

Use built-in Web Audio nodes:

- **BiquadFilterNode**: EQ, resonance, filters
- **ConvolverNode**: Reverb (requires impulse response)
- **DynamicsCompressorNode**: Compression
- **WaveShaperNode**: Distortion

Example delay effect:

```typescript
const delay = context.createDelay();
const feedback = context.createGain();

delay.delayTime.value = 0.5;  // 500ms delay
feedback.gain.value = 0.6;    // 60% feedback

source.connect(delay);
delay.connect(feedback);
feedback.connect(delay);      // Feedback loop
delay.connect(destination);
```

## ⚡ Performance Best Practices

### Audio Scheduling

✅ **DO**:
- Use `AudioContext.currentTime` for precise timing
- Schedule audio ahead of time (look-ahead pattern)
- Keep audio logic separate from React rendering

❌ **DON'T**:
- Use `setTimeout`/`setInterval` for audio events
- Schedule audio in React render cycles
- Create audio nodes inside render functions

### UI Performance

✅ **DO**:
- Use `React.memo` for grid cells
- Use `useCallback` for event handlers
- Use CSS transforms for animations (GPU-accelerated)
- Update UI with `requestAnimationFrame`

❌ **DON'T**:
- Re-render entire grid on every step
- Create new functions in render
- Use JavaScript for animations

## 🐛 Troubleshooting

### No Sound?

1. **Check browser compatibility**: Use Chrome, Firefox, or Safari
2. **Audio context suspended**: Click Play to initialize (browser autoplay policy)
3. **Samples not loaded**: Ensure files are loaded before playing
4. **Volume**: Check system volume and browser tab audio

### Timing Issues?

1. **Browser performance**: Close other tabs to free resources
2. **Sample rate mismatch**: Use samples with matching sample rates
3. **High CPU**: Reduce number of active steps or channels

### Build Errors?

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

## 📚 Resources

### Web Audio API

- [MDN Web Audio API Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
- [Audio Scheduling Tutorial](https://www.html5rocks.com/en/tutorials/audio/scheduling/)

### React & TypeScript

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Credits

Built with:
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **Web Audio API** - Audio processing

---

**Enjoy creating music!** 🎶

For questions or issues, check the inline code comments - every file is heavily documented with explanations and best practices.
