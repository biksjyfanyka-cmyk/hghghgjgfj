type SoundName =
  | "click"
  | "step"
  | "pickup"
  | "correct"
  | "wrong"
  | "teacher"
  | "chalk"
  | "locked"
  | "unlock"
  | "win"
  | "lose";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private ambientStarted = false;
  private noiseBuffer: AudioBuffer | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = window.localStorage.getItem("school13-muted") === "1";
    } catch {
      this.muted = false;
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.42;
      this.master.connect(this.ctx.destination);

      const length = Math.floor(this.ctx.sampleRate * 1.2);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.ctx;
  }

  async unlock() {
    const ctx = this.ensure();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        // The browser can refuse until another gesture. We try again on the next one.
      }
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      window.localStorage.setItem("school13-muted", muted ? "1" : "0");
    } catch {
      // localStorage may be unavailable in private frames.
    }
    const ctx = this.ensure();
    if (ctx && this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.42, ctx.currentTime + 0.08);
    }
  }

  startAmbient() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.ambientStarted) return;
    this.ambientStarted = true;
    void this.unlock();

    const hum = ctx.createGain();
    hum.gain.value = 0.028;
    hum.connect(this.master);

    const low = ctx.createOscillator();
    low.type = "sine";
    low.frequency.value = 46;
    low.connect(hum);

    const high = ctx.createOscillator();
    high.type = "triangle";
    high.frequency.value = 92;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.14;
    high.connect(highGain);
    highGain.connect(hum);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 9;
    lfo.connect(lfoGain);
    lfoGain.connect(low.frequency);

    low.start();
    high.start();
    lfo.start();
    this.ambientNodes = [low, high, lfo, hum, highGain, lfoGain];
  }

  stopAmbient() {
    for (const node of this.ambientNodes) {
      try {
        if ("stop" in node && typeof node.stop === "function") node.stop();
        node.disconnect();
      } catch {
        // Already stopped.
      }
    }
    this.ambientNodes = [];
    this.ambientStarted = false;
  }

  private tone(
    frequency: number,
    duration: number,
    options: { type?: OscillatorType; gain?: number; delay?: number; slideTo?: number } = {}
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const start = ctx.currentTime + (options.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = options.type ?? "sine";
    osc.frequency.setValueAtTime(frequency, start);
    if (options.slideTo) osc.frequency.exponentialRampToValueAtTime(options.slideTo, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain ?? 0.1), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  private noise(duration = 0.08, gainValue = 0.05, cutoff = 900) {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuffer) return;
    const start = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  play(name: SoundName) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    if (ctx.state === "suspended") void ctx.resume();

    switch (name) {
      case "click":
        this.tone(520, 0.045, { type: "square", gain: 0.035 });
        break;
      case "step":
        this.noise(0.075, 0.028, 380);
        break;
      case "pickup":
        this.tone(660, 0.1, { type: "triangle", gain: 0.1 });
        this.tone(990, 0.14, { type: "triangle", gain: 0.08, delay: 0.08 });
        break;
      case "correct":
        this.tone(523, 0.13, { type: "sine", gain: 0.11 });
        this.tone(659, 0.16, { type: "sine", gain: 0.1, delay: 0.1 });
        this.tone(784, 0.22, { type: "sine", gain: 0.09, delay: 0.2 });
        break;
      case "wrong":
        this.tone(148, 0.22, { type: "sawtooth", gain: 0.09, slideTo: 92 });
        this.tone(110, 0.25, { type: "square", gain: 0.045, delay: 0.03 });
        break;
      case "teacher":
        this.tone(82, 0.65, { type: "sawtooth", gain: 0.07, slideTo: 54 });
        this.tone(415, 1.1, { type: "triangle", gain: 0.035, delay: 0.08, slideTo: 370 });
        break;
      case "chalk":
        this.noise(0.25, 0.08, 2400);
        this.tone(1300, 0.2, { type: "triangle", gain: 0.04 });
        break;
      case "locked":
        this.tone(170, 0.13, { type: "square", gain: 0.06 });
        this.tone(130, 0.2, { type: "square", gain: 0.05, delay: 0.12 });
        break;
      case "unlock":
        this.tone(392, 0.18, { type: "triangle", gain: 0.08 });
        this.tone(523, 0.18, { type: "triangle", gain: 0.08, delay: 0.14 });
        this.tone(784, 0.36, { type: "triangle", gain: 0.08, delay: 0.28 });
        break;
      case "win":
        [392, 523, 659, 784].forEach((freq, i) =>
          this.tone(freq, 0.5, { type: "triangle", gain: 0.09, delay: i * 0.14 })
        );
        break;
      case "lose":
        [294, 247, 196, 147].forEach((freq, i) =>
          this.tone(freq, 0.55, { type: "sawtooth", gain: 0.055, delay: i * 0.16 })
        );
        break;
    }
  }
}

export const audio = new AudioEngine();
