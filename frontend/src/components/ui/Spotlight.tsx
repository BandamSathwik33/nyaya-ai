import React, { useEffect, useState } from "react";

export const Spotlight: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
        background: `radial-gradient(650px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.07), transparent 80%)`,
        transition: "background 0.15s ease-out",
      }}
    />
  );
};
