// Web Audio API Synthesizer for subtle futuristic UI feedback
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuteStatus(): boolean {
    return this.isMuted;
  }

  public playHover() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1300, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.005, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      // Ignored
    }
  }

  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      // Ignored
    }
  }

  public playSuccess() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.type = 'sine';
      osc2.type = 'sine';

      const now = this.ctx.currentTime;
      // Arpeggio
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.06); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.18); // C6

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.setValueAtTime(329.63, now + 0.1); // E4

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      // Ignored
    }
  }

  public playBoot() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      const now = this.ctx.currentTime;

      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.8);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.start();
      osc.stop(now + 0.9);
    } catch (e) {
      // Ignored
    }
  }

  public playTick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.002, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.02);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch (e) {
      // Ignored
    }
  }

  public playError() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      const now = this.ctx.currentTime;
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.linearRampToValueAtTime(100, now + 0.25);

      osc2.frequency.setValueAtTime(155, now);
      osc2.frequency.linearRampToValueAtTime(105, now + 0.25);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc1.start();
      osc2.start();
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } catch (e) {
      // Ignored
    }
  }
}

export const audio = new SoundSynthesizer();
