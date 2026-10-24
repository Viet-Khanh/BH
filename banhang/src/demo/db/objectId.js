let counter = 0;

// 24 hex chars: 12 time + 6 counter + 6 random. Increases with insertion order like ObjectId.
export const createObjectId = () => {
  counter = (counter + 1) % 0xffffff;
  const time = Date.now().toString(16).padStart(12, '0');
  const sequence = counter.toString(16).padStart(6, '0');
  const random = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return `${time}${sequence}${random}`;
};
