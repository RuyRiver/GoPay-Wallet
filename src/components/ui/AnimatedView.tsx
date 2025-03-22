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
      }, 500); // 500ms es la duración de la transición
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
      className={`fixed inset-0 z-40 bg-gray-100/80 backdrop-blur-sm transition-all duration-500 ease-in-out ${
        show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        perspective: '1000px',
      }}
    >
      <div 
        className={`fixed inset-0 flex items-center justify-center overflow-hidden`}
      >
        <div 
          className={`relative w-full max-w-md h-[85vh] bg-white flex flex-col overflow-hidden rounded-xl shadow-xl transition-all duration-500 ease-out transform ${
            show ? translateActiveClass : translateClass
          }`}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            boxShadow: show ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 0 0 rgba(0, 0, 0, 0)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AnimatedView; 