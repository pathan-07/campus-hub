/* eslint-disable @typescript-eslint/no-unused-vars */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Only initialize Genkit if an API key is present to avoid build/runtime crashes
export const ai = (apiKey ? genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.0-flash',
}) : {
  defineFlow: (config: any, ..._args: any[]) => {
    console.warn(`[Genkit] defineFlow skipped for ${config.name} (missing API key)`);
    return async (..._input: any[]) => {
      throw new Error(`AI feature ${config.name} is disabled because GOOGLE_GENAI_API_KEY is missing.`);
    };
  },
  definePrompt: (config: any, ..._args: any[]) => {
    console.warn(`[Genkit] definePrompt skipped for ${config.name} (missing API key)`);
    return async (..._input: any[]) => {
      throw new Error(`AI feature ${config.name} is disabled because GOOGLE_GENAI_API_KEY is missing.`);
    };
  },
  // Add other methods if needed, casting to any covers dynamic usage
}) as ReturnType<typeof genkit>;

if (!apiKey) {
  console.warn('⚠️ GOOGLE_GENAI_API_KEY is missing. AI features will be disabled.');
}
