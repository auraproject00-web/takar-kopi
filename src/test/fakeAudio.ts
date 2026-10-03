import { vi } from 'vitest'

/** Just enough of Web Audio to record what a beep schedules. */
class FakeParam {
  value = 0
  events: [string, number, number][] = []
  setValueAtTime(v: number, t: number) {
    this.events.push(['set', v, t])
    return this
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.events.push(['ramp', v, t])
    return this
  }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.events.push(['exp', v, t])
    return this
  }
}

class FakeNode {
  outputs: unknown[] = []
  connect<T>(node: T): T {
    this.outputs.push(node)
    return node
  }
}

export class FakeOscillator extends FakeNode {
  type = 'sine'
  frequency = new FakeParam()
  start = vi.fn()
  stop = vi.fn()
}

export class FakeGain extends FakeNode {
  gain = new FakeParam()
}

export class FakeFilter extends FakeNode {
  type = 'lowpass'
  frequency = new FakeParam()
}

export class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  state = 'running'
  currentTime = 0
  destination = { name: 'destination' }
  oscillators: FakeOscillator[] = []
  gains: FakeGain[] = []
  filters: FakeFilter[] = []
  resume = vi.fn()
  constructor() {
    FakeAudioContext.instances.push(this)
  }
  createOscillator() {
    const o = new FakeOscillator()
    this.oscillators.push(o)
    return o
  }
  createGain() {
    const g = new FakeGain()
    this.gains.push(g)
    return g
  }
  createBiquadFilter() {
    const f = new FakeFilter()
    this.filters.push(f)
    return f
  }
}

export function installFakeAudio(): void {
  FakeAudioContext.instances = []
  Object.defineProperty(window, 'AudioContext', { value: FakeAudioContext, configurable: true, writable: true })
}

export function removeFakeAudio(): void {
  Reflect.deleteProperty(window, 'AudioContext')
}
