// "ELΛ SYSTEMS": wide caps, the A drawn as a Λ (the font has no Λ, so it is a small SVG).
export function Wordmark() {
  return (
    <span className="wordmark" aria-label="ElaSystems">
      <span aria-hidden="true">EL</span>
      <svg viewBox="0 0 70 100" aria-hidden="true"><path d="M0 100 29 0h12l29 100h-9.5L35 9.5 9.5 100Z" fill="currentColor" /></svg>
      <b aria-hidden="true">SYSTEMS</b>
    </span>
  );
}
