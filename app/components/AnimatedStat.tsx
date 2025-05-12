import React, { useEffect, useRef, useState } from 'react';

interface AnimatedStatProps {
  value: number;
  label: string;
  duration?: number;
  className?: string;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value, label, duration = 1000, className }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimestamp = useRef<number | null>(null);

  useEffect(() => {
    let frame: number;
    const animate = (timestamp: number) => {
      if (!startTimestamp.current) startTimestamp.current = timestamp;
      const progress = Math.min((timestamp - startTimestamp.current) / duration, 1);
      setDisplayValue(Math.floor(progress * value));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <div className={`flex flex-col items-center ${className || ''}`}>
      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{displayValue}</span>
      <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</span>
    </div>
  );
};

export default AnimatedStat;
