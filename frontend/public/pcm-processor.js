/**
 * AudioWorkletProcessor — runs in a dedicated audio thread.
 * Accumulates Float32 samples into ~100ms chunks (1600 samples @ 16kHz),
 * converts to Int16 PCM and posts to the main thread.
 * AssemblyAI v3 requires chunks between 50ms and 1000ms.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Float32Array(0)
    // 100ms @ 16000 Hz = 1600 samples — well within the 50–1000ms window
    this._targetSamples = 1600
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const chunk = input[0]

    // Append incoming chunk to accumulation buffer
    const merged = new Float32Array(this._buffer.length + chunk.length)
    merged.set(this._buffer)
    merged.set(chunk, this._buffer.length)
    this._buffer = merged

    // Flush once we have enough samples
    while (this._buffer.length >= this._targetSamples) {
      const slice = this._buffer.slice(0, this._targetSamples)
      this._buffer = this._buffer.slice(this._targetSamples)

      const int16 = new Int16Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        const s = Math.max(-1, Math.min(1, slice[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }

      // Transfer zero-copy to main thread
      this.port.postMessage(int16.buffer, [int16.buffer])
    }

    return true
  }
}

registerProcessor('pcm-processor', PCMProcessor)
