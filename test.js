import CircularGapBuffer from "./CircularGapBuffer.js";

const buffer = new CircularGapBuffer();

buffer.insert("hello");
buffer.moveCursor(2);
buffer.insert("X");

console.log(buffer.toString()); // "heXllo"
console.log(buffer.cursor); // 3
console.log(buffer.length); // 6

buffer.insert("hello");
buffer.moveCursor(2);

const data = buffer.toSerializable();

console.log(data);
// {version: 1, text: "heXhellollo", cursor: 2}