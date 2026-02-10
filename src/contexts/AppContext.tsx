/**
 * APP CONTEXT
 * ===========
 * Centralized state management using React Context API.
 * 
 * PURPOSE:
 * -------
 * - Provide shared AudioEngine and Sequencer instances to all components
 * - Manage global app state (BPM, playing status, current step)
 * - Prevent prop drilling through component tree
 * - Ensure single source of truth for audio state
 */

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AudioEngine } from '../services/AudioEngine';
import { Sequencer } from '../services/Sequencer';
import { Synthesizer } from '../services/Synthesizer';
import { NoteRecorder } from '../services/NoteRecorder';
import { TransportState, RecordMode, QuantizeMode } from '../types/index';

interface AppContextType {
    audioEngine: AudioEngine;
    sequencer: Sequencer;
    synthesizer: Synthesizer;
    noteRecorder: NoteRecorder;
    bpm: number;
    setBPM: (bpm: number) => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    isInitialized: boolean;
    initializeAudio: () => Promise<void>;
    mode: 'pattern' | 'live';
    setMode: (mode: 'pattern' | 'live') => void;
    transportState: TransportState;
    setTransportState: (state: TransportState) => void;
    recordMode: RecordMode;
    setRecordMode: (mode: RecordMode) => void;
    quantizeMode: QuantizeMode;
    setQuantizeMode: (mode: QuantizeMode) => void;
}

const AppContext = createContext<AppContextType | null>(null);

/**
 * Custom hook to access app context.
 * Throws error if used outside provider.
 */
export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

/**
 * App Provider Component
 * ----------------------
 * Initializes audio services and provides them to the component tree.
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // Create audio services once (using refs to persist across renders)
    const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
    const sequencerRef = useRef<Sequencer>(new Sequencer(audioEngineRef.current, 8, 32));
    const synthesizerRef = useRef<Synthesizer | null>(null);
    const noteRecorderRef = useRef<NoteRecorder>(new NoteRecorder(120));

    // App state
    const [bpm, setBPMState] = useState<number>(120);
    const [isPlaying, setIsPlayingState] = useState<boolean>(false);
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [mode, setMode] = useState<'pattern' | 'live'>('pattern');
    const [transportState, setTransportState] = useState<TransportState>(TransportState.STOPPED);
    const [recordMode, setRecordMode] = useState<RecordMode>(RecordMode.LIVE);
    const [quantizeMode, setQuantizeMode] = useState<QuantizeMode>(QuantizeMode.SIXTEENTH);

    /**
     * Initialize audio engine (must be called after user gesture).
     */
    const initializeAudio = async () => {
        if (isInitialized) return;

        await audioEngineRef.current.initialize();
        // Initialize synthesizer with the same context
        synthesizerRef.current = new Synthesizer(audioEngineRef.current.getContext()!);
        setIsInitialized(true);
        console.log('Audio engine initialized');

        // Setup Sequencer callbacks
        sequencerRef.current.setOnStepChange((step) => {
            setCurrentStep(step);
        });

        // Setup NoteRecorder playback via Sequencer
        sequencerRef.current.setOnSchedule((step, time) => {
            // Assuming 16th notes (4 steps per beat)
            const beatStart = step / 4;
            const beatEnd = (step + 1) / 4;

            if (synthesizerRef.current && noteRecorderRef.current) {
                noteRecorderRef.current.schedulePlayback(
                    beatStart,
                    beatEnd,
                    time,
                    synthesizerRef.current
                );
            }
        });

        // Load default samples
        try {
            await Promise.all([
                audioEngineRef.current.loadSample('0', '/samples/kick.wav'),
                audioEngineRef.current.loadSample('1', '/samples/snare.wav'),
                audioEngineRef.current.loadSample('2', '/samples/hihat.wav'),
                audioEngineRef.current.loadSample('3', '/samples/clap.wav'),
            ]);
            console.log('Default samples loaded');
        } catch (error) {
            console.warn('Failed to load default samples:', error);
        }
    };

    /**
     * Set BPM and update audio engine.
     */
    const setBPM = (newBPM: number) => {
        setBPMState(newBPM);
        audioEngineRef.current.setBPM(newBPM);
        noteRecorderRef.current.setBPM(newBPM);
    };

    /**
     * Set playing state.
     */
    const setIsPlaying = (playing: boolean) => {
        setIsPlayingState(playing);
    };

    /**
     * Register step change callback when sequencer is created.
     */
    useEffect(() => {
        sequencerRef.current.setOnStepChange((step) => {
            setCurrentStep(step);
        });
    }, []);

    const value: AppContextType = {
        audioEngine: audioEngineRef.current,
        sequencer: sequencerRef.current,
        synthesizer: synthesizerRef.current!,
        noteRecorder: noteRecorderRef.current,
        bpm,
        setBPM,
        isPlaying,
        setIsPlaying,
        currentStep,
        setCurrentStep,
        isInitialized,
        initializeAudio,
        mode,
        setMode,
        transportState,
        setTransportState,
        recordMode,
        setRecordMode,
        quantizeMode,
        setQuantizeMode,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
