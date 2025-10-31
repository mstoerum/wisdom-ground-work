// Sound effect utility using Web Audio API for instant, crisp sounds
class SoundEffects {
  private audioContext: AudioContext | null = null;

  constructor() {
    // Initialize AudioContext lazily to avoid autoplay restrictions
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private async ensureContext() {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Recording start: gentle, low beep (400Hz, 100ms)
  async playRecordStart() {
    await this.ensureContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 400; // Low, friendly tone
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Recording stop: slightly higher beep (600Hz, 100ms)
  async playRecordStop() {
    await this.ensureContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 600; // Slightly higher
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Processing: gentle whoosh (sweep from 200Hz to 800Hz, 150ms)
  async playProcessing() {
    await this.ensureContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.15);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // Success: pleasant two-tone chime (C5 -> E5, 200ms total)
  async playSuccess() {
    await this.ensureContext();
    if (!this.audioContext) return;

    // First note (C5 - 523Hz)
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);
    osc1.frequency.value = 523;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    osc1.start(this.audioContext.currentTime);
    osc1.stop(this.audioContext.currentTime + 0.1);

    // Second note (E5 - 659Hz) - slight overlap for smooth transition
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);
    osc2.frequency.value = 659;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, this.audioContext.currentTime + 0.08);
    gain2.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    osc2.start(this.audioContext.currentTime + 0.08);
    osc2.stop(this.audioContext.currentTime + 0.2);
  }

  // Error: low descending tone (400Hz -> 200Hz, 300ms)
  async playError() {
    await this.ensureContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();
