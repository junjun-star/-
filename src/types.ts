/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MetricValues {
  avgMd: number | null;
  adjRange: number | null;
  modRange: number | null;
  ilValue: number | null;
  tmaxName?: string;
  tminName?: string;
}

export interface SlideQueueItem {
  image: string; // base64 or object url
  imageFileName: string;
  sourceFileName: string;
  metrics: MetricValues;
}

export interface Palette {
  name: string;
  primary: string;
  accent: string;
  blob1: string;
  blob2: string;
  blob3: string;
  blob4: string;
}

export interface ParsedRow {
  [key: string]: any;
}
