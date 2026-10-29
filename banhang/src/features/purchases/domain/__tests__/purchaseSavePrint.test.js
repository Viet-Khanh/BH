import { describe, expect, it } from 'vitest';
import {
  getCheckoutKeyPrint,
  getPurchasePrintPlan,
} from '../purchaseSavePrint.js';

describe('getPurchasePrintPlan', () => {
  it('prints nothing on F12 (save without printing)', () => {
    expect(getPurchasePrintPlan({}, true, { print: false })).toEqual({
      slip: false,
      labels: false,
    });
    expect(getPurchasePrintPlan({}, true)).toEqual({
      slip: false,
      labels: false,
    });
  });

  it('prints the slip and opens the labels on F8 by default', () => {
    expect(getPurchasePrintPlan({}, true, { print: true })).toEqual({
      slip: true,
      labels: true,
    });
  });

  it('follows the settings on F8', () => {
    expect(
      getPurchasePrintPlan({ purchasePrintSlip: false }, true, { print: true })
    ).toEqual({ slip: false, labels: true });
    expect(
      getPurchasePrintPlan({ autoPrintLabelsOnPurchase: false }, true, {
        print: true,
      })
    ).toEqual({ slip: true, labels: false });
  });

  it('opens the labels only with the labels flag', () => {
    expect(getPurchasePrintPlan({}, false, { print: true })).toEqual({
      slip: true,
      labels: false,
    });
  });
});

describe('getCheckoutKeyPrint', () => {
  it('maps F8 to save and print, F12 to save without printing', () => {
    expect(getCheckoutKeyPrint({ key: 'F8' })).toBe(true);
    expect(getCheckoutKeyPrint({ key: 'F12' })).toBe(false);
  });

  it('ignores other keys and modified F-keys', () => {
    expect(getCheckoutKeyPrint({ key: 'Enter' })).toBeNull();
    expect(getCheckoutKeyPrint({ key: 'F8', ctrlKey: true })).toBeNull();
    expect(getCheckoutKeyPrint({ key: 'F12', altKey: true })).toBeNull();
    expect(getCheckoutKeyPrint({ key: 'F12', metaKey: true })).toBeNull();
    expect(getCheckoutKeyPrint(null)).toBeNull();
  });
});
