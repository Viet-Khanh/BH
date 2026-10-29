import { describe, expect, it } from 'vitest';
import { createTaskQueue } from '../taskQueue.js';

const later = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

describe('createTaskQueue', () => {
  it('runs tasks one after another in submission order', async () => {
    const queue = createTaskQueue();
    const done = [];
    const first = queue.run(async () => done.push(await later(20, 'a')));
    const second = queue.run(async () => done.push(await later(1, 'b')));
    await Promise.all([first, second]);
    expect(done).toEqual(['a', 'b']);
  });

  it('returns each task result and keeps going after a failure', async () => {
    const queue = createTaskQueue();
    const failed = queue.run(async () => {
      throw new Error('offline');
    });
    const next = queue.run(async () => 'ok');
    await expect(failed).rejects.toThrow('offline');
    await expect(next).resolves.toBe('ok');
  });
});
