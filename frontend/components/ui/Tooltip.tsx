'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [above, setAbove] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (visible && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 240; // w-60 = 240px
      const tooltipHeight = 100; // estimado
      
      // Calcular posición horizontal centrada
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      
      // Ajustar si se sale por la derecha
      if (left + tooltipWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipWidth - 10;
      }
      
      // Ajustar si se sale por la izquierda
      if (left < 10) {
        left = 10;
      }
      
      // Determinar si va arriba o abajo
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldBeAbove = spaceBelow < tooltipHeight && spaceAbove > spaceBelow;
      
      setAbove(shouldBeAbove);
      setPosition({
        top: shouldBeAbove ? rect.top - 8 : rect.bottom + 8,
        left: left
      });
    }
  }, [visible]);

  return (
    <>
      <span className="relative inline-flex items-center ml-1">
        <button
          ref={buttonRef}
          type="button"
          aria-label="Más información"
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          onFocus={() => setVisible(true)}
          onBlur={() => setVisible(false)}
          className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center leading-none focus:outline-none focus:ring-1 focus:ring-[#232A37] transition-colors"
        >
          ?
        </button>
      </span>
      {visible && typeof window !== 'undefined' && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: above ? 'translateY(-100%)' : 'none'
          }}
          className="z-[9999] w-60 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none leading-relaxed"
        >
          {text}
          <span
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
              above
                ? 'bottom-[-8px] border-t-gray-900'
                : 'top-[-8px] border-b-gray-900'
            }`}
            style={{
              left: buttonRef.current 
                ? `${buttonRef.current.getBoundingClientRect().left + buttonRef.current.getBoundingClientRect().width / 2 - position.left}px`
                : '50%'
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
