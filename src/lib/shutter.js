export const shutterApi = { run: null };

// Close the blades, swap what's behind them, open again.
export const shutter = (label, midway) =>
  shutterApi.run ? shutterApi.run(label, midway) : midway();
