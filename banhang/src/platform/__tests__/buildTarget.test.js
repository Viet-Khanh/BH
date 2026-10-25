import { expect, it } from 'vitest';
import { resolveBuildTarget } from '../buildTarget.js';

it('defaults to the legacy aluminium/glass identity', () => {
  expect(resolveBuildTarget()).toEqual({
    edition: 'nhomkinh',
    customer: null,
    productName: 'BanHang',
    appExeName: 'BanHang.exe',
    appId: 'com.rostek.banhang',
    installerGuid: 'D0196E87-7934-44B9-A107-6C5F0B6F9C72',
    installerBaseName: 'BanHang-Setup',
  });
});

it('resolves an edition build', () => {
  expect(resolveBuildTarget({ edition: 'pharmacy' })).toMatchObject({
    edition: 'pharmacy',
    customer: null,
    productName: 'BanHang-NhaThuoc',
    appId: 'com.rostek.banhang.pharmacy',
    installerBaseName: 'BanHang-NhaThuoc-Setup',
  });
});

it('derives the edition from a customer', () => {
  expect(resolveBuildTarget({ customer: 'example' })).toMatchObject({
    edition: 'nhomkinh',
    customer: 'example',
    appId: 'com.rostek.banhang.customer.example',
  });
});

it('rejects unknown ids and mismatches', () => {
  expect(() => resolveBuildTarget({ edition: 'nope' })).toThrow(
    'Unknown edition "nope"'
  );
  expect(() => resolveBuildTarget({ customer: 'nope' })).toThrow(
    'Unknown customer "nope"'
  );
  expect(() =>
    resolveBuildTarget({ edition: 'pharmacy', customer: 'example' })
  ).toThrow('Customer "example" extends "nhomkinh", not "pharmacy"');
});
