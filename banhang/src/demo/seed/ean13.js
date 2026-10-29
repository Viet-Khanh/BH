// EAN-13 with a valid check digit from 12 digits.
export const ean13 = (twelveDigits) => {
  const digits = String(twelveDigits).padStart(12, '0').slice(-12);
  const sum = [...digits].reduce(
    (acc, digit, index) => acc + Number(digit) * (index % 2 ? 3 : 1),
    0
  );
  return `${digits}${(10 - (sum % 10)) % 10}`;
};
