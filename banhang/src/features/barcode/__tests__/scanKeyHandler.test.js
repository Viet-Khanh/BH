import { describe, expect, it, vi } from 'vitest';
import { createScanKeyHandler } from '../scanKeyHandler.js';

const keyEvent = (key, timeStamp, extra = {}) => ({
  key,
  timeStamp,
  repeat: false,
  isComposing: false,
  keyCode: 0,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...extra,
});

const setup = ({ blocked = false } = {}) => {
  const snapshot = { node: 'search-input', value: 'old' };
  const deps = {
    onScan: vi.fn(),
    isBlocked: vi.fn(() => blocked),
    getFocusedField: vi.fn(() => snapshot),
    restoreField: vi.fn(),
  };
  return { deps, snapshot, handle: createScanKeyHandler(deps) };
};

const press = (handle, keys, start, gap, extra) =>
  [...keys].map((key, index) => {
    const event = keyEvent(key, start + index * gap, extra);
    handle(event);
    return event;
  });

const prevented = (events) =>
  events.filter((event) => event.preventDefault.mock.calls.length > 0);

describe('createScanKeyHandler', () => {
  it('lets a fast typing burst without Enter through untouched', () => {
    const { deps, handle } = setup();
    const events = press(handle, 'nhanh', 0, 5);
    expect(prevented(events)).toEqual([]);
    expect(deps.onScan).not.toHaveBeenCalled();
    expect(deps.restoreField).not.toHaveBeenCalled();
  });

  it('does not treat a Telex correction burst + slow Enter as a scan', () => {
    const { deps, handle } = setup();
    const events = [
      keyEvent('Backspace', 100),
      keyEvent('ễ', 100.3),
      keyEvent('n', 100.6),
      keyEvent('Enter', 400),
    ];
    events.forEach(handle);
    expect(prevented(events)).toEqual([]);
    expect(deps.onScan).not.toHaveBeenCalled();
  });

  it('does not treat a Telex correction burst + fast Enter as a scan', () => {
    const { deps, handle } = setup();
    const events = ['Backspace', 'Backspace', 't', 'i', 'ề', 'n'].map(
      (key, index) => keyEvent(key, 100 + index * 0.2)
    );
    events.push(keyEvent('Enter', 110));
    events.forEach(handle);
    expect(prevented(events)).toEqual([]);
    expect(deps.onScan).not.toHaveBeenCalled();
  });

  it('turns a scan into onScan, prevents only the Enter and restores the field', () => {
    const { deps, snapshot, handle } = setup();
    const chars = press(handle, '8934588012345', 1000, 10);
    const enter = keyEvent('Enter', 1135);
    handle(enter);
    expect(prevented(chars)).toEqual([]);
    expect(enter.preventDefault).toHaveBeenCalledTimes(1);
    expect(enter.stopPropagation).toHaveBeenCalledTimes(1);
    expect(deps.getFocusedField).toHaveBeenCalledTimes(1);
    expect(deps.restoreField).toHaveBeenCalledWith(snapshot);
    expect(deps.onScan).toHaveBeenCalledTimes(1);
    expect(deps.onScan).toHaveBeenCalledWith('8934588012345');
  });

  it('lets Enter through after slow typing', () => {
    const { deps, handle } = setup();
    press(handle, '8934', 0, 200);
    const enter = keyEvent('Enter', 650);
    handle(enter);
    expect(enter.preventDefault).not.toHaveBeenCalled();
    expect(deps.onScan).not.toHaveBeenCalled();
  });

  it('ignores repeated, composing and modified keys', () => {
    const { deps, handle } = setup();
    press(handle, '1234', 0, 5, { repeat: true });
    press(handle, '1234', 30, 5, { isComposing: true });
    press(handle, '1234', 60, 5, { keyCode: 229 });
    press(handle, '1234', 90, 5, { ctrlKey: true });
    const enter = keyEvent('Enter', 115);
    handle(enter);
    expect(enter.preventDefault).not.toHaveBeenCalled();
    expect(deps.onScan).not.toHaveBeenCalled();
  });

  it('keeps Shift inside a scan (upper-case codes)', () => {
    const { deps, handle } = setup();
    ['Shift', 'A', 'B', 'Shift', 'C', '1', '2'].forEach((key, index) =>
      handle(keyEvent(key, index * 5))
    );
    handle(keyEvent('Enter', 40));
    expect(deps.onScan).toHaveBeenCalledWith('ABC12');
  });

  it('does nothing while blocked (a modal is open)', () => {
    const { deps, handle } = setup({ blocked: true });
    const events = press(handle, '8934588012345', 0, 10);
    const enter = keyEvent('Enter', 135);
    handle(enter);
    expect(prevented([...events, enter])).toEqual([]);
    expect(deps.getFocusedField).not.toHaveBeenCalled();
    expect(deps.onScan).not.toHaveBeenCalled();
  });
});
