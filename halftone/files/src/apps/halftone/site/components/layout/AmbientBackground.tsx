/**
 * Four-layer ambient canvas, fixed behind every page:
 *   1. radial base gradient (near-black, lit from top)
 *   2. floating blurred light pools — violet key light, lime rim, indigo fill
 *   3. 64px technical grid, masked to fade out
 *   4. film-grain noise to kill banding
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0d0d14_0%,#08080a_50%,#040405_100%)]" />

      {/* light pools */}
      <div className="absolute left-1/2 top-[-40rem] h-[1400px] w-[900px] -translate-x-1/2 animate-float rounded-full bg-[radial-gradient(closest-side,rgb(142_124_255/0.24),rgb(142_124_255/0.06)_55%,transparent)] blur-[150px]" />
      <div className="absolute -left-72 top-48 h-[800px] w-[600px] animate-float-slow rounded-full bg-[radial-gradient(closest-side,rgb(200_245_60/0.1),rgb(120_90_220/0.08)_60%,transparent)] blur-[120px]" />
      <div className="absolute -right-56 top-[30rem] h-[700px] w-[500px] animate-float rounded-full bg-[radial-gradient(closest-side,rgb(90_110_255/0.12),rgb(142_124_255/0.05)_60%,transparent)] blur-[100px] [animation-delay:-4s]" />
      <div className="absolute bottom-[-22rem] left-1/3 h-[600px] w-[900px] animate-pulse-glow rounded-full bg-[radial-gradient(closest-side,rgb(200_245_60/0.07),transparent)] blur-[120px]" />

      {/* grid */}
      <div className="bg-grid absolute inset-0 opacity-[0.025] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_30%,transparent_100%)]" />

      {/* noise */}
      <div className="bg-noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />
    </div>
  )
}
