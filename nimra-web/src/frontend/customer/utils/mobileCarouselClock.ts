'use client';

type CarouselTickListener = () => void;

const listeners = new Set<CarouselTickListener>();
let timer: ReturnType<typeof setTimeout> | null = null;

const scheduleNextTick = () => {
  if (timer) clearTimeout(timer);
  timer = null;
  if (listeners.size === 0) return;

  timer = setTimeout(() => {
    timer = null;
    listeners.forEach((listener) => listener());
    scheduleNextTick();
  }, 3000);
};

export const subscribeToMobileCarouselClock = (listener: CarouselTickListener) => {
  listeners.add(listener);
  if (listeners.size === 1) scheduleNextTick();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
};

export const resetMobileCarouselClock = () => {
  scheduleNextTick();
};
