import type { LlmRuntime } from './contract';

/**
 * llama.rn adapter for the Tier B contract. Lazy-requires the native module
 * so importing this file never touches native code; the model file is the
 * hash-verified artifact from downloadManager (model.lock), never bundled.
 * Low temperature on purpose: the contract wants faithful paraphrase of the
 * retrieved verses, not creativity.
 */
export interface LlamaRuntimeHandle extends LlmRuntime {
  release(): Promise<void>;
}

export async function createLlamaRuntime(modelPath: string): Promise<LlamaRuntimeHandle> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initLlama } = require('llama.rn') as typeof import('llama.rn');
  const ctx = await initLlama({
    model: modelPath,
    n_ctx: 2048,
    // Metal acceleration; llama.rn falls back to CPU where unavailable.
    n_gpu_layers: 99,
  });
  return {
    async complete(prompt: string): Promise<string> {
      const res = await ctx.completion({
        prompt,
        n_predict: 220,
        temperature: 0.2,
        stop: ['</s>', '<|im_end|>', '<|endoftext|>'],
      });
      return res.text;
    },
    async release(): Promise<void> {
      await ctx.release();
    },
  };
}
