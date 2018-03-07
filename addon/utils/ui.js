export function extractNumber(numberString) {
  if (numberString === "") {
    return 0;
  }

  if (numberString.endsWith('px') || numberString.endsWith('em')) {
    return parseFloat(numberString.substr(0, numberString.length - 2));
  }

  if (numberString.endsWith('%')) {
    return parseFloat(numberString.substr(0, numberString.length - 1));
  }

  return NaN;
}
