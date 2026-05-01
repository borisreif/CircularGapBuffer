import test from "node:test";
import assert from "node:assert/strict";

import CircularGapBuffer from "../CircularGapBuffer.js";

test("creates an empty buffer", () => {
  const buffer = new CircularGapBuffer();

  assert.equal(buffer.toString(), "");
  assert.equal(buffer.length, 0);
  assert.equal(buffer.cursor, 0);
  assert.equal(buffer.isEmpty, true);
  assert.equal(buffer.debugValidate(), true);
});

test("inserts text at the cursor", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");

  assert.equal(buffer.toString(), "hello");
  assert.equal(buffer.length, 5);
  assert.equal(buffer.cursor, 5);
  assert.equal(buffer.isEmpty, false);
});

test("moves the cursor and inserts text in the middle", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");
  buffer.moveCursor(2);
  buffer.insert("X");

  assert.equal(buffer.toString(), "heXllo");
  assert.equal(buffer.cursor, 3);
});

test("backspace deletes the character before the cursor", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");
  buffer.moveCursor(3);

  const deleted = buffer.backspace();

  assert.equal(deleted, "l");
  assert.equal(buffer.toString(), "helo");
  assert.equal(buffer.cursor, 2);
});

test("backspace returns null at the beginning", () => {
  const buffer = new CircularGapBuffer();

  assert.equal(buffer.backspace(), null);
  assert.equal(buffer.toString(), "");
});

test("deleteForward deletes the character after the cursor", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");
  buffer.moveCursor(1);

  const deleted = buffer.deleteForward();

  assert.equal(deleted, "e");
  assert.equal(buffer.toString(), "hllo");
  assert.equal(buffer.cursor, 1);
});

test("deleteForward returns null at the end", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");

  assert.equal(buffer.deleteForward(), null);
  assert.equal(buffer.toString(), "hello");
});

test("deleteRange deletes a half-open range", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello world");

  const deletedCount = buffer.deleteRange(5, 11);

  assert.equal(deletedCount, 6);
  assert.equal(buffer.toString(), "hello");
  assert.equal(buffer.cursor, 5);
});

test("deleteRange clamps numeric positions", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");

  const deletedCount = buffer.deleteRange(-100, 100);

  assert.equal(deletedCount, 5);
  assert.equal(buffer.toString(), "");
  assert.equal(buffer.cursor, 0);
});

test("clear removes all text but preserves capacity", () => {
  const buffer = new CircularGapBuffer(32);

  buffer.insert("hello");

  const capacityBefore = buffer.capacity;

  buffer.clear();

  assert.equal(buffer.toString(), "");
  assert.equal(buffer.length, 0);
  assert.equal(buffer.cursor, 0);
  assert.equal(buffer.isEmpty, true);
  assert.equal(buffer.capacity, capacityBefore);
});

test("setText replaces the entire buffer contents", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("old text");
  buffer.setText("new text");

  assert.equal(buffer.toString(), "new text");
  assert.equal(buffer.length, 8);
  assert.equal(buffer.cursor, 8);
});

test("charAt returns characters by logical index", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");

  assert.equal(buffer.charAt(0), "h");
  assert.equal(buffer.charAt(1), "e");
  assert.equal(buffer.charAt(4), "o");
});

test("charAt clamps out-of-range positions", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("hello");

  assert.equal(buffer.charAt(-10), "h");
  assert.equal(buffer.charAt(Infinity), "");
});

test("buffer grows when the gap becomes full", () => {
  const buffer = new CircularGapBuffer(2);

  buffer.insert("hello");

  assert.equal(buffer.toString(), "hello");
  assert.equal(buffer.length, 5);
  assert.ok(buffer.capacity >= 5);
  assert.equal(buffer.debugValidate(), true);
});

test("insert rejects non-string values", () => {
  const buffer = new CircularGapBuffer();

  assert.throws(() => {
    buffer.insert(123);
  }, TypeError);
});

test("setText rejects non-string values", () => {
  const buffer = new CircularGapBuffer();

  assert.throws(() => {
    buffer.setText(null);
  }, TypeError);
});

test("moveCursor rejects invalid positions", () => {
  const buffer = new CircularGapBuffer();

  assert.throws(() => {
    buffer.moveCursor(NaN);
  }, TypeError);

  assert.throws(() => {
    buffer.moveCursor("2");
  }, TypeError);
});

test("deleteRange rejects invalid positions", () => {
  const buffer = new CircularGapBuffer();

  assert.throws(() => {
    buffer.deleteRange(0, NaN);
  }, TypeError);

  assert.throws(() => {
    buffer.deleteRange("0", 2);
  }, TypeError);
});

test("uses JavaScript UTF-16 string offsets", () => {
  const buffer = new CircularGapBuffer();

  buffer.insert("A😊B");

  assert.equal(buffer.toString(), "A😊B");
  assert.equal(buffer.length, "A😊B".length);
  assert.equal(buffer.length, 4);
});

test("slice returns a logical substring", () => {
  const buffer = CircularGapBuffer.fromText("abcdefghijklmnopqrstuvwxyz");

  assert.equal(buffer.slice(0, 5), "abcde");
  assert.equal(buffer.slice(5, 10), "fghij");
  assert.equal(buffer.slice(20), "uvwxyz");
});

test("slice supports negative indexes like String.prototype.slice", () => {
  const buffer = CircularGapBuffer.fromText("abcdefghijklmnopqrstuvwxyz");

  assert.equal(buffer.slice(-5), "vwxyz");
  assert.equal(buffer.slice(0, -20), "abcdef");
  assert.equal(buffer.slice(-10, -5), "qrstu");
});

test("slice works after cursor movement and insertion", () => {
  const buffer = CircularGapBuffer.fromText("abcdef");
  buffer.moveCursor(3);
  buffer.insert("XXX");

  assert.equal(buffer.toString(), "abcXXXdef");
  assert.equal(buffer.slice(2, 7), "cXXXd");
});

test("toString equals slice over the full buffer", () => {
  const buffer = CircularGapBuffer.fromText("hello world");
  buffer.moveCursor(5);
  buffer.insert(",");

  assert.equal(buffer.toString(), buffer.slice(0, buffer.length));
});

test("slice rejects invalid indexes", () => {
  const buffer = CircularGapBuffer.fromText("hello");

  assert.throws(() => {
    buffer.slice("0", 2);
  }, TypeError);

  assert.throws(() => {
    buffer.slice(0, NaN);
  }, TypeError);
});

test("slice matches String.prototype.slice after mixed edits", () => {
  const buffer = CircularGapBuffer.fromText("abcdefghijklmnopqrstuvwxyz");

  buffer.moveCursor(8);
  buffer.insert("XXX");
  buffer.deleteRange(2, 5);
  buffer.moveCursor(buffer.length - 3);
  buffer.insert("YYY");
  buffer.backspace();
  buffer.deleteForward();

  const text = buffer.toString();

  for (let start = -text.length - 2; start <= text.length + 2; start++) {
    for (let end = -text.length - 2; end <= text.length + 2; end++) {
      assert.equal(buffer.slice(start, end), text.slice(start, end));
    }
  }
});