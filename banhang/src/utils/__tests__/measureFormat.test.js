import { expect, it } from 'vitest';
import {
  formatDimension,
  formatMeasure,
  isEmptyValue,
} from '../measureFormat.js';

it('formats measures with up to 3 decimals', () => {
  expect(formatMeasure(1234.5678)).toBe('1.234,568');
  expect(formatMeasure(null)).toBe('0');
});

it('supports blank output for empty or zero values', () => {
  expect(formatMeasure('', { blankOnEmpty: true })).toBe('');
  expect(formatMeasure(0, { blankOnZero: true })).toBe('');
  expect(isEmptyValue(undefined)).toBe(true);
});

it('formats dimensions only when positive', () => {
  expect(formatDimension(2.4)).toBe('2,4');
  expect(formatDimension(0)).toBe('');
});
