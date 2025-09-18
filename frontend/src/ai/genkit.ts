import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

process.env.GENKIT_DISABLE_TRACING = 'true';
process.env.GENKIT_TRACING_ENABLED = 'false';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.0-flash',
  enableTracingAndMetrics: false,
  tracing: {
    enabled: false,
  },
  observability: {
    tracing: false,
    metrics: false,
  },
});
