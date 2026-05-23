"use client";

import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

const BRAND_COLORS = [
  "#15803d", // verde Brasil
  "#facc15", // amarelo
  "#dc2626", // vermelho USA/CAN/MEX
  "#1d4ed8", // azul USA
  "#ffffff", // branco
];

interface Particle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotate: number;
  color: string;
  size: number;
}

type Magnitude = "small" | "medium" | "large";

const COUNTS: Record<Magnitude, number> = {
  small: 18,
  medium: 40,
  large: 80,
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeBurst(origin: { x: number; y: number }, count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 220;
    return {
      id: randomId(),
      x: origin.x,
      y: origin.y,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 100,
      rotate: (Math.random() - 0.5) * 720,
      color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
      size: 6 + Math.random() * 6,
    };
  });
}

interface CelebrateAPI {
  fire: (
    el?: HTMLElement | null,
    magnitude?: Magnitude,
  ) => void;
}

let currentAPI: CelebrateAPI | null = null;

/**
 * Hook que retorna a função `fire()`. Renderiza o `<CelebrateLayer />` no
 * topo da árvore (ex: layout) UMA vez. Aí qualquer componente chama
 * `useCelebrate().fire(elementRef.current, 'medium')`.
 */
export function useCelebrate(): CelebrateAPI {
  return {
    fire: (el, magnitude = "small") => {
      currentAPI?.fire(el, magnitude);
    },
  };
}

export function CelebrateLayer() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const reduce = useReducedMotion();

  const fire = useCallback<CelebrateAPI["fire"]>(
    (el, magnitude = "small") => {
      if (reduce) return;
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      if (el) {
        const r = el.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      const burst = makeBurst({ x, y }, COUNTS[magnitude]);
      setParticles((prev) => [...prev, ...burst]);
      const ids = new Set(burst.map((p) => p.id));
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
      }, 1500);
    },
    [reduce],
  );

  useEffect(() => {
    currentAPI = { fire };
    return () => {
      if (currentAPI?.fire === fire) currentAPI = null;
    };
  }, [fire]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[200] overflow-hidden"
    >
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{
              x: p.x,
              y: p.y,
              opacity: 1,
              rotate: 0,
              scale: 0.6,
            }}
            animate={{
              x: p.x + p.dx,
              y: p.y + p.dy + 400, // gravidade simulada
              opacity: 0,
              rotate: p.rotate,
              scale: 1,
            }}
            transition={{
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: p.size,
              height: p.size * 0.6,
              background: p.color,
              borderRadius: 2,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
