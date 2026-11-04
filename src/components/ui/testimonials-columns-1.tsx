"use client";
import React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

// 21st.dev's "testimonials columns": a column of reviews scrolling upwards
// on a loop (the list twice over, so it wraps without a seam). Cards here
// are frosted glass with a star row. Reduced motion holds the column still
// (framer-motion skips the movement under <MotionConfig reducedMotion="user">).

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Array<{
    text: string;
    image: string;
    name: string;
    role: string;
  }>;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, name, role }, i) => (
                <figure
                  key={i}
                  aria-hidden={index === 1 || undefined}
                  className="relative w-full max-w-xs rounded-[1.5rem] bg-white/[0.06] p-6 ring-1 ring-white/[0.12] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_24px_60px_-30px_rgba(0,0,0,0.85)] transition-colors duration-300 hover:ring-green-300/30"
                >
                  <Quote aria-hidden className="absolute right-5 top-5 h-6 w-6 text-green-300/30" />
                  <div className="flex gap-0.5" aria-hidden>
                    {[0, 1, 2, 3, 4].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-white/85">{text}</blockquote>
                  <figcaption className="mt-5 border-t border-white/10 pt-4">
                    <div className="text-sm font-semibold text-white">{name}</div>
                    {role && <div className="mt-0.5 text-xs text-white/55">{role}</div>}
                  </figcaption>
                </figure>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
