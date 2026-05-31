"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function EntryLoader({ children }: { children: React.ReactNode }) {
  const [showLoader, setShowLoader] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState("");

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const textInterval = useRef<NodeJS.Timeout | null>(null);
  const fullText = "Digital Xpress";

  useEffect(() => {
    const lastShown = localStorage.getItem("lastSpinnerShown");
    const shouldShow = !lastShown || Date.now() - parseInt(lastShown) > 60 * 60 * 1000;

    if (shouldShow) {
      const duration = 2.5 + Math.random() * 2.5; // max 5 seconds
      const totalSteps = 60;
      let step = 0;
      const intervalTime = (duration * 1000) / totalSteps;

      setShowLoader(true);
      setProgress(0);
      setDisplayedText("");

      progressInterval.current = setInterval(() => {
        step++;
        const newProgress = (step / totalSteps) * 100;
        setProgress(Math.min(newProgress, 100));
        if (step >= totalSteps) {
          clearInterval(progressInterval.current!);
          finishLoading();
        }
      }, intervalTime);

      let charIndex = 0;
      textInterval.current = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(textInterval.current!);
        }
      }, 80);
    } else {
      setLoadingComplete(true);
    }

    function finishLoading() {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (textInterval.current) clearInterval(textInterval.current);
      localStorage.setItem("lastSpinnerShown", Date.now().toString());
      setShowLoader(false);
      setLoadingComplete(true);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (textInterval.current) clearInterval(textInterval.current);
    };
  }, []);

  if (!loadingComplete && showLoader) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-orange-900">
        {/* Minimalist container */}
        <div className="flex flex-col items-center justify-center px-6 text-center">
          {/* Animated letter-by-letter text */}
          <div className="mb-10 flex flex-wrap justify-center gap-0.5 text-3xl font-light tracking-wide sm:text-4xl md:text-5xl">
            {displayedText.split("").map((char, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                className="text-orange-400"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>

          {/* Thin capsule loader */}
          <div className="w-72 max-w-[80vw] sm:w-80">
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-800">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-orange-500"
                style={{ width: `${progress}%` }}
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear" }}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <span className="font-mono text-xs text-orange-400/80">
                {Math.floor(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Developer credit */}
        <div className="absolute bottom-6 text-center text-xs text-gray-400">
          Developed by Shariful Islam Udoy
        </div>
      </div>
    );
  }

  return <>{children}</>;
}