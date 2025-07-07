'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/answer-campus-resource-question.ts';
import '@/ai/flows/create-event-from-text.ts';
import '@/ai/flows/analyze-events.ts';
