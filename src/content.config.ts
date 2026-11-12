import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Tutorials: one MDX file per topic at
 *   src/content/tutorials/<cert>/<module>/<topic>.mdx
 * The entry id ("az-900/cloud-concepts/what-is-cloud-computing") is the URL.
 * The prose follows the standard lesson template (story → explain like I'm 10 →
 * technical → business scenario → visual → when to use). Interview questions
 * and quick revision live in frontmatter so the layout renders them uniformly.
 */
const interviewItem = z.object({
  level: z.enum(['beginner', 'intermediate', 'experienced', 'scenario', 'architecture']),
  q: z.string(),
  a: z.string(),
  followUps: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

const tutorials = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/tutorials' }),
  schema: z.object({
    title: z.string(),
    /** <title> tag; keep under ~60 characters. */
    seoTitle: z.string().max(70),
    /** Meta description; 120–160 characters. */
    description: z.string().min(80).max(170),
    /** One- or two-sentence direct answer shown at the top (answer-engine friendly). */
    answer: z.string(),
    updated: z.coerce.date(),
    readingMinutes: z.number().int().positive(),
    keyTerms: z.array(z.object({ term: z.string(), definition: z.string() })).default([]),
    interview: z.array(interviewItem).min(3),
    revision: z.object({
      keyPoints: z.array(z.string()).min(3),
      mistakes: z.array(z.string()).min(1),
      examTips: z.array(z.string()).min(1),
      quick: z.array(z.object({ q: z.string(), a: z.string() })).length(5),
    }),
    references: z.array(z.object({ title: z.string(), url: z.string().url() })).min(1),
    related: z.array(z.string()).default([]),
  }),
});

/**
 * Question banks: JSON files under src/content/questions/<cert>/.
 * A file with `topic` feeds that topic's knowledge check AND the mock exam;
 * a file without one is mock-exam only. All questions are original practice
 * questions written for this site — never real or leaked exam content.
 */
const question = z.object({
  id: z.string(),
  type: z.enum(['single', 'multi']),
  scenario: z.string().optional(),
  question: z.string(),
  options: z.array(z.object({ text: z.string(), why: z.string() })).min(2).max(6),
  /** Zero-based indexes of the correct options. */
  answer: z.array(z.number().int().nonnegative()).min(1),
  explanation: z.string(),
  objective: z.string().optional(),
});

const questions = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/questions' }),
  schema: z.object({
    cert: z.string(),
    /** Exam area number (1..n): AZ-900 has 3, AI-900 has 5. */
    domain: z.number().int().min(1).max(9),
    topic: z.string().optional(),
    questions: z.array(question).min(1),
  }),
});

export const collections = { tutorials, questions };
export type Question = z.infer<typeof question>;
