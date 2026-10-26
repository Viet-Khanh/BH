import { describe, expect, it } from 'vitest';
import {
  initialRequestValues,
  requestSummary,
  toRequest,
} from '../domain/buyerRequest.js';

describe('buyer request', () => {
  it('prefills from a company customer', () => {
    expect(
      initialRequestValues(null, {
        name: 'Công ty An Phát',
        taxCode: '0312345678',
        address: 'Q.5',
        email: 'kt@anphat.vn',
      })
    ).toEqual({
      companyName: 'Công ty An Phát',
      taxCode: '0312345678',
      buyerName: '',
      address: 'Q.5',
      email: 'kt@anphat.vn',
    });
  });

  it('starts empty for walk-in customers and keeps entered data', () => {
    expect(
      initialRequestValues(null, { name: 'Khách lẻ', address: 'x' })
    ).toMatchObject({ buyerName: '', address: '' });
    const request = toRequest({ companyName: ' Bình Minh ', taxCode: '0101' });
    expect(request).toMatchObject({
      requested: true,
      companyName: 'Bình Minh',
    });
    expect(initialRequestValues(request, { name: 'Khách lẻ' }).taxCode).toBe(
      '0101'
    );
  });

  it('summarises the request for the counter button', () => {
    expect(
      requestSummary(toRequest({ companyName: 'Bình Minh', taxCode: '0101' }))
    ).toBe('Bình Minh · MST 0101');
    expect(requestSummary({ requested: false, companyName: 'x' })).toBe('');
  });
});
