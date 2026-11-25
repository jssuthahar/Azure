/**
 * AI-103 "extract" area (Information Extraction): everything this part of the course plugs into
 * the shared engines (3D scene text, portal tours, problem cards, exam items,
 * games, comparisons and service cards). Items are original, written from the
 * official skills outline. Owned by one lesson agent; other areas don't edit it.
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';
import type { Tour } from '../../tour-kit';
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

/** Lesson slug → 3D step (mode 'agentextract') and portal tour. */
export const SIMS: Record<string, LessonSims> = {};
/** 3D scene narration for mode 'agentextract' (builder: src/lib/dc3d/agent/agentextract.ts). */
export const SCENE: Sim3D = { title: 'Information Extraction (scene coming soon)', steps: [{ title: 'Coming soon', text: 'This scene is being built.' }] };
/** Portal walkthroughs, ids start agt-. */
export const TOURS: Record<string, Tour> = {};
export const PROBLEMS: Record<string, ProblemSolution> = {};
export const ITEMS: FormatItem[] = [];
export const SORT: SortSet[] = [];
export const RIDDLES: Riddle[] = [];
export const COMPARE: Comparison[] = [];
export const SERVICES: Service[] = [];
