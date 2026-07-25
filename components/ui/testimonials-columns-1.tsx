"use client";
import React from "react";
import { motion } from "framer-motion";

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
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-4 sm:p-6 rounded-2xl border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 max-w-xs w-full bg-[#132d13] hover:bg-[#1a3d2e]" key={i}>
                  <div className="text-gray-300 leading-relaxed mb-4 sm:mb-5 text-sm sm:text-base">{text}</div>
                  <div className="flex flex-col mt-4 sm:mt-5">
                      <div className="font-medium tracking-tight leading-5 text-white text-sm sm:text-base">{name}</div>
                      {role && <div className="leading-5 opacity-60 tracking-tight text-gray-400 text-xs sm:text-sm">{role}</div>}
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};