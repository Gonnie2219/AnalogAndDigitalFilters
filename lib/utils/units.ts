/** Convert frequency between Hz and rad/s */
export function hzToRad(hz: number): number {
  return hz * 2 * Math.PI;
}

export function radToHz(rad: number): number {
  return rad / (2 * Math.PI);
}
