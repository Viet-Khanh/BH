import { beforeEach, describe, expect, it } from 'vitest';
import { createModel } from '../db/DemoModel.js';
import { configureStorage, setActiveNamespace } from '../db/localStore.js';
import { Schema } from '../db/schema.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

const Product = createModel(
  'Product',
  new Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    stock: Number,
    isDeleted: { type: Boolean, default: false },
    items: [new Schema({ productId: String }, { _id: false })],
  })
);

const seed = () =>
  Product.insertMany(
    [
      { id: 'a', name: 'Bia', stock: 5 },
      { id: 'b', name: 'An', stock: 0, items: [{ productId: 'x' }] },
      { id: 'c', name: 'Ca', stock: 9, isDeleted: true },
    ],
    { ordered: false }
  );

describe('DemoModel', () => {
  beforeEach(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace('test');
    await seed();
  });

  it('finds with filter, sort, limit and projection', async () => {
    const docs = await Product.find({ isDeleted: { $ne: true } }, { id: 1 })
      .sort({ name: 1 })
      .limit(1)
      .lean();
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ id: 'b' });
    expect(docs[0].name).toBeUndefined();
    expect(docs[0]._id).toMatch(/^[0-9a-f]{24}$/);
  });

  it('supports dotted array queries and $or/$in/$gte', async () => {
    expect(
      await Product.findOne({ 'items.productId': { $in: ['x'] } })
    ).toMatchObject({ id: 'b' });
    const docs = await Product.find({
      $or: [{ stock: { $gte: 9 } }, { id: 'a' }],
    }).sort({ _id: -1 });
    expect(docs.map((doc) => doc.id)).toEqual(['c', 'a']);
  });

  it('returns copies that cannot mutate stored data', async () => {
    const doc = await Product.findOne({ id: 'a' }).lean();
    doc.name = 'changed';
    expect((await Product.findOne({ id: 'a' })).name).toBe('Bia');
  });

  it('findOneAndUpdate applies $set/$inc and honours new/upsert', async () => {
    const before = await Product.findOneAndUpdate(
      { id: 'a' },
      { $inc: { stock: -2 } }
    );
    expect(before.stock).toBe(5);
    const after = await Product.findOneAndUpdate(
      { id: 'a' },
      { $set: { name: 'Bia 333', ignored: undefined } },
      { new: true }
    ).lean();
    expect(after).toMatchObject({ name: 'Bia 333', stock: 3 });
    expect(
      await Product.findOneAndUpdate({ id: 'z' }, { $set: { name: 'Z' } })
    ).toBeNull();
    const created = await Product.findOneAndUpdate(
      { id: 'z' },
      { $set: { name: 'Z' } },
      { new: true, upsert: true }
    ).lean();
    expect(created).toMatchObject({ id: 'z', name: 'Z', isDeleted: false });
  });

  it('bulkWrite, updateMany and deleteMany', async () => {
    const result = await Product.bulkWrite(
      [{ updateOne: { filter: { id: 'b' }, update: { $inc: { stock: 4 } } } }],
      { ordered: true }
    );
    expect(result.matchedCount).toBe(1);
    expect((await Product.findOne({ id: 'b' })).stock).toBe(4);
    const updated = await Product.updateMany(
      { isDeleted: true },
      { $set: { stock: 0 } }
    );
    expect(updated.matchedCount).toBe(1);
    expect((await Product.deleteMany({ stock: 0 })).deletedCount).toBe(1);
    expect(await Product.find({})).toHaveLength(2);
  });

  it('enforces unique keys and required fields', async () => {
    await expect(Product.create({ id: 'a' })).rejects.toThrow('E11000');
    await expect(Product.create({ name: 'no id' })).rejects.toThrow(
      'validation failed'
    );
    expect(await Product.find({})).toHaveLength(3);
  });

  it('fails loudly on unsupported features', async () => {
    await expect(
      Product.find({ name: { $regex: 'B' } }).exec()
    ).rejects.toThrow('DemoModel: unsupported query operator $regex');
    await expect(
      Product.findOneAndUpdate({ id: 'a' }, { $push: { items: {} } }).exec()
    ).rejects.toThrow('DemoModel: unsupported update operator $push');
    expect(() =>
      Product.findOneAndUpdate({ id: 'a' }, {}, { session: 1 })
    ).toThrow('DemoModel: unsupported option session');
  });
});

describe('DemoModel barcode queries', () => {
  const ScanProduct = createModel(
    'ScanProduct',
    new Schema({
      id: { type: String, required: true, unique: true },
      name: String,
      barcode: String,
      units: [
        new Schema(
          { name: String, factor: Number, barcode: String },
          { _id: false }
        ),
      ],
    })
  );

  beforeEach(async () => {
    configureStorage(createMemoryStorage());
    setActiveNamespace('test');
    await ScanProduct.insertMany([
      { id: 'p1', name: 'Coca', barcode: 'A1' },
      {
        id: 'p2',
        name: 'Bia',
        units: [{ name: 'thùng', factor: 24, barcode: 'B2' }],
      },
    ]);
  });

  it('matches unit barcodes by dotted path with $in and RegExp', async () => {
    const byIn = await ScanProduct.find({
      'units.barcode': { $in: ['B2'] },
    }).lean();
    expect(byIn.map((doc) => doc.id)).toEqual(['p2']);
    const byRegex = await ScanProduct.find({
      $or: [{ barcode: /B2/i }, { 'units.barcode': /B2/i }],
    }).lean();
    expect(byRegex.map((doc) => doc.id)).toEqual(['p2']);
  });
});
