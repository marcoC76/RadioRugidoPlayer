/**
 * Web Audio API synthesizer for authentic reggae sound system effects.
 * Synthesizes classic Space Lasers, Dub Sirens, and Airhorns on-the-fly.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a classic Dub Siren effect.
 * Uses a Low Frequency Oscillator (LFO) to modulate the frequency of a main oscillator.
 */
export function playDubSiren(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const mainOsc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const mainGain = ctx.createGain();
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();

    // Configure oscillators
    mainOsc.type = 'square';
    mainOsc.frequency.setValueAtTime(380, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(6, now); // LFO Speed: 6Hz

    // Configure delay line for dub echo (feedback)
    delay.delayTime.setValueAtTime(0.35, now);
    feedback.gain.setValueAtTime(0.4, now); // 40% feedback

    // Connect LFO modulation to main oscillator frequency
    lfoGain.gain.setValueAtTime(220, now); // Modulation depth
    lfo.connect(lfoGain);
    lfoGain.connect(mainOsc.frequency);

    // Envelopes
    mainGain.gain.setValueAtTime(0, now);
    mainGain.gain.linearRampToValueAtTime(volume * 0.7, now + 0.05);
    mainGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5); // Fades out over 2.5s

    // Route audio with delay/feedback loop
    mainOsc.connect(mainGain);
    
    // Connect to output directly
    mainGain.connect(ctx.destination);
    
    // Connect feedback loop
    mainGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay); // loop back
    delay.connect(ctx.destination); // output delayed signal

    // Start & Stop
    lfo.start(now);
    mainOsc.start(now);

    lfo.stop(now + 2.6);
    mainOsc.stop(now + 2.6);
  } catch (err) {
    console.error("Failed to play Dub Siren:", err);
  }
}

/**
 * Play a classic Sci-Fi Space Laser pitch sweep downwards.
 */
export function playSpaceLaser(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const delay = ctx.createDelay();
    const feedback = ctx.createGain();

    osc.type = 'sawtooth';
    
    // Pitch sweep: 1800Hz down to 100Hz in 0.4 seconds
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    // Dub delay effect
    delay.delayTime.setValueAtTime(0.2, now);
    feedback.gain.setValueAtTime(0.3, now);

    // Volume Envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);

    // Routing
    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.0);
  } catch (err) {
    console.error("Failed to play Space Laser:", err);
  }
}

/**
 * Play a synthesized Soundclash Airhorn.
 * Sums several dense sawtooth waves with rapid volume pulses to recreate the classic "pew-pew-pew" cluster.
 */
export function playAirhorn(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // We combine multiple oscillators to make a thick brassy horn chord
    const baseFreqs = [165, 220, 330, 440, 520];
    const oscillators: OscillatorNode[] = [];
    const masterGain = ctx.createGain();
    
    masterGain.gain.setValueAtTime(0, now);
    // Pulsed volume envelope to simulate the classic quick airblast rhythm: "pew-pew-pew-pew!"
    const pulseTimes = [0, 0.18, 0.36, 0.54];
    pulseTimes.forEach((startTime) => {
      masterGain.gain.setValueAtTime(0, now + startTime);
      masterGain.gain.linearRampToValueAtTime(volume * 0.9, now + startTime + 0.02);
      masterGain.gain.exponentialRampToValueAtTime(0.05, now + startTime + 0.14);
    });
    
    // Final fade out
    masterGain.gain.setValueAtTime(0.05, now + 0.68);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    baseFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      // Thick sawtooth wave
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      // Add slight pitch drop over the course of the horn
      osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + 1.0);
      
      osc.connect(masterGain);
      oscillators.push(osc);
    });

    masterGain.connect(ctx.destination);

    oscillators.forEach((osc) => osc.start(now));
    oscillators.forEach((osc) => osc.stop(now + 1.3));
  } catch (err) {
    console.error("Failed to play Airhorn:", err);
  }
}

/**
 * Simulates a classic vinyl record scratch / rewind sound.
 * Generates low-frequency bandpass noise that swoops downwards in frequency and volume.
 */
export function playVinylRewind(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Create a noise buffer
    const bufferSize = ctx.sampleRate * 0.8; // 0.8 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // Filter to shape noise into a vinyl scratching sound
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(4.0, now);
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.6);

    // Gain Envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * 1.5, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

    // Route
    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 0.85);
  } catch (err) {
    console.error("Failed to play Vinyl Rewind effect:", err);
  }
}
