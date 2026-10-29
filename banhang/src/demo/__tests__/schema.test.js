import { describe, expect, it } from 'vitest';
import { Schema } from '../db/schema.js';

const ItemSchema = new Schema(
  { productId: String, qty: Number },
  { _id: false }
);
const OrderSchema = new Schema({
  id: { type: String, required: true, unique: true },
  total: Number,
  paid: { type: Boolean, default: false },
  stock: {
    type: Number,
    default() {
      return Number(this.openingStock || 0);
    },
  },
  openingStock: Number,
  items: [ItemSchema],
});

describe('Schema', () => {
  it('drops unknown fields and casts scalars (strict mode)', () => {
    const doc = OrderSchema.cast({
      _id: 'x',
      id: 7,
      total: '1500',
      extra: 'gone',
      items: [{ productId: 'p', qty: '2', junk: 1 }],
    });
    expect(doc).toEqual({
      _id: 'x',
      id: '7',
      total: 1500,
      items: [{ productId: 'p', qty: 2 }],
    });
  });

  it('casts empty string numbers to null and rejects garbage', () => {
    expect(OrderSchema.cast({ total: '' }).total).toBeNull();
    expect(() => OrderSchema.cast({ total: 'abc' })).toThrow(
      'Cast to Number failed'
    );
  });

  it('applies defaults, including function defaults bound to the doc', () => {
    const doc = OrderSchema.applyDefaults({ id: 'a', openingStock: 5 });
    expect(doc).toMatchObject({ paid: false, stock: 5, items: [] });
  });

  it('validates required fields and exposes unique keys', () => {
    expect(() => OrderSchema.validate({}, 'Order')).toThrow(
      'Order validation failed: id'
    );
    expect(OrderSchema.uniqueKeys).toEqual(['id']);
  });

  it('keeps plain object fields (type: Object) as is, with fresh defaults', () => {
    const Settings = new Schema({
      layout: { type: Object, default: () => ({ blocks: [{ key: 'a' }] }) },
    });
    const layout = { fontSizePx: 14, blocks: [{ key: 'qr', on: true }] };
    expect(Settings.cast({ layout }).layout).toEqual(layout);
    const first = Settings.applyDefaults({});
    const second = Settings.applyDefaults({});
    expect(first.layout).toEqual({ blocks: [{ key: 'a' }] });
    expect(first.layout).not.toBe(second.layout);
  });
});
