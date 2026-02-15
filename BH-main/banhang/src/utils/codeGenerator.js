import dayjs from 'dayjs';

export const generateCode = (prefix) => {
  const date = dayjs().format('YYYYMMDD');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${date}-${rand}`;
};
