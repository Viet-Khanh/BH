import { afterEach, describe, expect, it, vi } from 'vitest';
import { playBeep } from '../beep.js';

const node = () => ({
  connect: vi.fn((next) => next),
  frequency: {},
  gain: {},
  start: vi.fn(),
  stop: vi.fn(),
});

class FakeAudioContext {
  static instance = null;
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = {};
    this.resume = vi.fn(() => Promise.resolve());
    FakeAudioContext.instance = this;
  }
  createOscillator = () => node();
  createGain = () => node();
}

describe('playBeep', () => {
  afterEach(() => {
    delete globalThis.window;
  });

  it('resumes a suspended audio context before playing', () => {
    globalThis.window = { AudioContext: FakeAudioContext };
    playBeep('ok');
    expect(FakeAudioContext.instance.resume).toHaveBeenCalledTimes(1);
  });

  it('stays silent without Web Audio', () => {
    globalThis.window = {};
    expect(() => playBeep('error')).not.toThrow();
  });
});
