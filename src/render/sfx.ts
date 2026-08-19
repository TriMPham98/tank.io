let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof AudioContext === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(freq: number, dur: number, gain = 0.04, type: OscillatorType = "square"): void {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

export function sfxShoot(): void {
  beep(220, 0.05, 0.03, "square");
}

export function sfxHit(): void {
  beep(140, 0.06, 0.03, "sawtooth");
}

export function sfxLevel(): void {
  beep(440, 0.12, 0.05, "triangle");
}

export function sfxDeath(): void {
  beep(80, 0.3, 0.06, "sawtooth");
}

export function resumeAudio(): void {
  void ac()?.resume();
}
