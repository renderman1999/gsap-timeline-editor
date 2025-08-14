// Utility functions for rounding values
export const roundDelay = (delay: number): number => {
  // Round to 3 decimal places (0.001s = 1ms precision)
  return Math.round(delay * 1000) / 1000;
};

export const roundDuration = (duration: number): number => {
  // Round to whole milliseconds
  return Math.round(duration);
};

export default { roundDelay, roundDuration };
