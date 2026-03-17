import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(endTime) - +new Date();
    if (difference <= 0) return null;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      totalSeconds: Math.floor(difference / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft(newTime);

      if (!newTime) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) {
    return <span className="text-xs font-bold text-gray-500 uppercase">⌛ Đã kết thúc</span>;
  }

  // Hiệu ứng FOMO: Dưới 30 giây thì đỏ và rung
  const isUrgent = timeLeft.totalSeconds <= 30;

  return (
    <div
      className={`flex items-center gap-1 font-mono font-bold transition-all ${
        isUrgent ? 'animate-shake scale-110 text-red-600' : 'text-blue-600'
      }`}
    >
      {timeLeft.days > 0 && <span>{timeLeft.days}d</span>}
      <span>{String(timeLeft.hours).padStart(2, '0')}:</span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}:</span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      {isUrgent && <span className="animate-pulse text-[10px]">🔥</span>}
    </div>
  );
};

export default CountdownTimer;
