/** Fit a design canvas without upscaling; positioning remains the caller's responsibility. */
export function viewportScale(
  viewportWidth: number,
  viewportHeight: number,
  designWidth: number,
  designHeight: number,
) {
  return Math.max(0, Math.min(1, viewportWidth / designWidth, viewportHeight / designHeight));
}
