import confetti from "canvas-confetti";

/** Bright greeting-card palette. */
const COLORS = [
  "#FF4D6D",
  "#FF8C42",
  "#FFD166",
  "#06D6A0",
  "#4CC9F0",
  "#4361EE",
  "#B5179E",
  "#F72585",
  "#80FFDB",
  "#FEE440",
];

/** Above dialog overlay/content so confetti covers the full screen. */
const Z = 10060;

const ribbon = confetti.shapeFromPath({
  path: "M0 0 C8 -6 16 6 24 0 L24 3 C16 9 8 -3 0 3 Z",
});
const strip = confetti.shapeFromPath({
  path: "M0 0 L28 2 L27 6 L0 4 Z",
});

const MIX = ["circle", "square", "star", ribbon, strip] as confetti.Shape[];
const RIBBONS = [ribbon, strip] as confetti.Shape[];

function firePopper(opts: {
  x: number;
  y: number;
  angle: number;
  particleCount?: number;
  startVelocity?: number;
  spread?: number;
  scalar?: number;
}) {
  const base: confetti.Options = {
    colors: COLORS,
    zIndex: Z,
    disableForReducedMotion: true,
    flat: false,
    gravity: 0.9,
    drift: (Math.random() - 0.5) * 0.6,
    ticks: 320,
    origin: { x: opts.x, y: opts.y },
    angle: opts.angle,
    spread: opts.spread ?? 62,
    startVelocity: opts.startVelocity ?? 52,
  };

  confetti({
    ...base,
    particleCount: opts.particleCount ?? 90,
    scalar: opts.scalar ?? 1.05,
    shapes: MIX,
  });

  confetti({
    ...base,
    particleCount: Math.round((opts.particleCount ?? 90) * 0.35),
    scalar: (opts.scalar ?? 1.05) * 1.25,
    shapes: RIBBONS,
    startVelocity: (opts.startVelocity ?? 52) * 0.85,
  });
}

/** Full-screen colorful party-popper confetti + scatter. */
export function firePartyBomb() {
  firePopper({ x: 0.12, y: 0.78, angle: 60, particleCount: 110, startVelocity: 58 });
  firePopper({ x: 0.88, y: 0.78, angle: 120, particleCount: 110, startVelocity: 58 });

  window.setTimeout(() => {
    firePopper({
      x: 0.5,
      y: 0.72,
      angle: 90,
      particleCount: 130,
      startVelocity: 62,
      spread: 78,
      scalar: 1.15,
    });
  }, 180);

  window.setTimeout(() => {
    const end = Date.now() + 2400;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 90,
        spread: 100,
        startVelocity: 18,
        gravity: 0.55,
        scalar: 0.75 + Math.random() * 0.55,
        ticks: 280,
        origin: { x: Math.random(), y: -0.05 },
        colors: COLORS,
        shapes: MIX,
        flat: false,
        zIndex: Z,
        disableForReducedMotion: true,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, 320);
}
