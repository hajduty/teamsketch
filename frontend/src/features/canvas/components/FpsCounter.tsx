import { useEffect, useRef, useState } from "react";

const FpsCounter = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      const now = performance.now();
      frameCount.current++;

      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        background: "rgba(0,0,0,0.6)",
        color: "lime",
        fontSize: "14px",
        padding: "4px 8px",
        borderRadius: "4px",
        fontFamily: "monospace",
        zIndex: 1000,
      }}
    >
      FPS: {fps}
    </div>
  );
};

export default FpsCounter;