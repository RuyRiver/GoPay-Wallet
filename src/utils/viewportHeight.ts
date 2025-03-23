// Utility function to handle viewport height calculation
// This solves the issue of mobile browsers (especially iOS) with their
// UI elements taking up screen space

/**
 * Sets a CSS variable (--vh) that represents 1% of the viewport height
 * This allows us to use CSS like `height: calc(var(--vh, 1vh) * 100)`
 * which works correctly on mobile browsers
 */
export const setViewportHeight = (): void => {
  // First we get the viewport height and multiply it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

/**
 * Initializes the viewport height calculation and sets up a resize listener
 * Should be called early in your app's lifecycle (e.g., in main.tsx)
 */
export const initViewportHeight = (): void => {
  // Set the initial viewport height
  setViewportHeight();
  
  // Add event listener for window resize and orientation change
  window.addEventListener('resize', setViewportHeight);
  window.addEventListener('orientationchange', setViewportHeight);
  
  // Optional: For iOS Safari specifically, we can also update on scroll
  // as the address bar can hide/show during scrolling
  window.addEventListener('scroll', setViewportHeight);
};

/**
 * Cleans up the event listeners
 * Call this when your app unmounts if needed
 */
export const cleanupViewportHeight = (): void => {
  window.removeEventListener('resize', setViewportHeight);
  window.removeEventListener('orientationchange', setViewportHeight);
  window.removeEventListener('scroll', setViewportHeight);
}; 