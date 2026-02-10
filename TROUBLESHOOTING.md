# 🔊 Audio Troubleshooting Guide

## Common Causes & Solutions

### ✅ **Step 1: Load Audio Samples**

The most common reason for no sound is **no samples loaded**.

**How to load samples:**
1. Click **"+ Load Sample"** next to each channel name
2. Select an audio file (.wav, .mp3, .ogg)
3. Wait for status to change to **"✓ Loaded"** (green)
4. The browser console should log: `Sample loaded: channel_X`

**Where to get sample files:**
- Free drum kits: [freesound.org](https://freesound.org)
- Download drum samples: kick.wav, snare.wav, hihat.wav
- Or use any audio files from your computer

---

### ✅ **Step 2: Create a Pattern**

**After loading samples:**
1. Click on grid cells to activate steps (they'll turn bright cyan)
2. Try this simple pattern:
   - **Channel 0**: Click steps 1, 5, 9, 13 (kick rhythm)
   - **Channel 1**: Click steps 5, 13 (snare)

---

### ✅ **Step 3: Press Play**

1. Click the **Play button** (large circular button with ▶)
2. First time only: Browser will initialize audio (console logs "Audio system initialized")
3. Pattern should start playing and looping

---

### ✅ **Step 4: Check Browser Console**

**Open Developer Tools:**
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: Press `F12`
- Go to the **Console** tab

**What to look for:**
- ✅ **Good**: "Audio system initialized", "Sequencer started", "Sample loaded: channel_X"
- ❌ **Bad**: Red error messages (send me these if you see them)

---

### ✅ **Step 5: Check Volume**

- System volume is turned up
- Browser tab is not muted (look for speaker icon on tab)
- Headphones/speakers are connected

---

## Quick Test Pattern

**To test if everything is working:**

1. **Load ONE sample** (any audio file) into Channel 0
2. **Click step 1** in Channel 0 (first square)
3. **Press Play**
4. You should hear the sample play every 16 steps

If this works, your DAW is functional! 🎉

---

## Still No Sound?

**Check these:**
- [ ] Browser is Chrome, Firefox, or Safari (Edge)
- [ ] At least one sample is loaded (shows "✓ Loaded")
- [ ] At least one step is active (bright cyan color)
- [ ] Play button is pressed (shows pink/active state)
- [ ] No red errors in console

**Send me:**
- Screenshot of the DAW
- Any error messages from the console
- Which browser you're using

I'll help fix it! 🎵
