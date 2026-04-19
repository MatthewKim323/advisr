"use client";

/**
 * Bubbles — ambient bubble streams rising up the left/right columns of the
 * viewport, outside the sub hull. Gives the page a constant sense of *being
 * underwater* without distracting from the office interior.
 */
export default function Bubbles() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20">
      {stream.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.x}vw`,
            bottom: 0,
            width: b.size,
            height: b.size,
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(77,216,211,0.3) 55%, rgba(77,216,211,0.05) 100%)",
            boxShadow:
              "0 0 4px rgba(77,216,211,0.5), 0 0 8px rgba(77,216,211,0.2)",
            animation: `bubble-rise ${b.duration}s linear infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Concentrated on left + right gutters so they hug the edges of the viewport
 * rather than drifting across the sub interior.
 */
const stream: Array<{ x: number; size: number; duration: number; delay: number }> = [
  // left gutter
  { x: 1.5, size: 4, duration: 18, delay: 0    },
  { x: 2.8, size: 3, duration: 22, delay: 4.2  },
  { x: 0.8, size: 5, duration: 16, delay: 8    },
  { x: 3.5, size: 3, duration: 20, delay: 11.5 },
  { x: 2,   size: 2, duration: 14, delay: 15   },

  // right gutter
  { x: 97.5, size: 4, duration: 19, delay: 2    },
  { x: 98.8, size: 3, duration: 23, delay: 6.5  },
  { x: 96.5, size: 5, duration: 17, delay: 10.2 },
  { x: 99,   size: 2, duration: 15, delay: 13.5 },
  { x: 96,   size: 3, duration: 21, delay: 17   },
];
