import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
}

export default function BlurText({
  text,
  className = "",
  delay = 0,
  animateBy = "words",
  direction = "bottom",
}: BlurTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const elements = animateBy === "words" ? text.split(" ") : text.split("");

  return (
    <span
      ref={ref}
      className={`inline-flex flex-wrap ${className}`}
      style={{ display: "inline-flex" }}
    >
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial={{
            filter: "blur(10px)",
            opacity: 0,
            y: direction === "bottom" ? 20 : -20,
          }}
          animate={
            isInView
              ? {
                  filter: "blur(0px)",
                  opacity: 1,
                  y: 0,
                }
              : {}
          }
          transition={{
            duration: 0.8,
            delay: delay / 1000 + i * (animateBy === "words" ? 0.1 : 0.03),
            ease: [0.215, 0.61, 0.355, 1], // easeOutCubic
          }}
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            marginRight: animateBy === "words" ? "0.3em" : "0",
          }}
        >
          {el === " " ? "\u00A0" : el}
        </motion.span>
      ))}
    </span>
  );
}
