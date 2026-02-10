/**
 * MAIN APPLICATION COMPONENT
 * ==========================
 * Root component that assembles the DAW interface.
 * 
 * LAYOUT STRUCTURE:
 * ----------------
 * - AppProvider (context wrapper)
 *   - TopBar (branding + BPM control)
 *   - Main Content Area
 *     - ChannelRack (step sequencer)
 *   - TransportControls (play/stop controls)
 * 
 * STATE MANAGEMENT:
 * ----------------
 * All state is managed through AppContext, providing:
 * - AudioEngine instance
 * - Sequencer instance
 * - Global app state (BPM, playing, current step)
 */

import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { TopBar } from './components/TopBar/TopBar';
import { ChannelRack } from './components/ChannelRack/ChannelRack';
import { PianoKeyboard } from './components/PianoKeyboard/PianoKeyboard';
import { ModeSwitch } from './components/ModeSwitch/ModeSwitch';
import { TransportControls } from './components/TransportControls/TransportControls';
import styles from './App.module.css';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { mode } = useApp();

  return (
    <div className={styles.app}>
      {/* Application Header */}
      <TopBar />

      {/* Mode Switcher */}
      <ModeSwitch />

      {/* Main Content Area - Conditional Rendering */}
      <main className={styles.main}>
        {mode === 'pattern' ? <ChannelRack /> : <PianoKeyboard />}
      </main>

      {/* Transport Controls */}
      {mode === 'pattern' && <TransportControls />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
