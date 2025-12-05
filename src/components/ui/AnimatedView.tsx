import React, { useState, useEffect } from "react";

interface AnimatedViewProps {
  show: boolean;
  children: React.ReactNode;
  direction?: "right" | "left" | "up" | "down";
}

/**
 * Componente para transiciones animadas entre vistas
 *
 * @param show - Si se muestra la vista
 * @param children - Contenido a mostrar
 * @param direction - Dirección de la animación (right, left, up, down)
 */
const AnimatedView: React.FC<AnimatedViewProps> = ({
  show,
  children,
  direction = "right"
}) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (show) {
      setMounted(true);
    }
    
    // Si la vista se oculta, esperamos a que termine la transición antes de desmontar
    if (!show && mounted) {
      const timer = setTimeout(() => {
        setMounted(false);
      }, 700); // Increased to 700ms to match the new animation duration
      return () => clearTimeout(timer);
    }
  }, [show, mounted]);
  
  if (!show && !mounted) return null;
  
  // Determinar las clases de animación según la dirección
  let translateClass = "translate-x-full opacity-0";
  let translateActiveClass = "translate-x-0 opacity-100";
  
  if (direction === "left") {
    translateClass = "-translate-x-full opacity-0";
    translateActiveClass = "translate-x-0 opacity-100";
  } else if (direction === "up") {
    translateClass = "translate-y-full opacity-0";
    translateActiveClass = "translate-y-0 opacity-100";
  } else if (direction === "down") {
    translateClass = "-translate-y-full opacity-0";
    translateActiveClass = "translate-y-0 opacity-100";
  }
  
  return (
    <div
      className={`absolute inset-0 z-40 bg-gray-100/80 backdrop-blur-sm transition-all duration-700 ease-out ${
        show ? "opacity-100 pointer-events-auto animate-fade-in-up" : "opacity-0 pointer-events-none animate-fade-out-down"
      }`}
      style={{
        perspective: '1000px'
      }}
    >
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <div
          className={`flex-1 w-full bg-white flex flex-col overflow-hidden transition-all duration-700 ease-out transform ${show ? `${translateActiveClass}` : `${translateClass}`}`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AnimatedView;