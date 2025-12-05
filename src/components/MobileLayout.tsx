import React, { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
}

/**
 * Mobile layout wrapper that displays content in a centered mobile-sized container
 * Simulates a mobile device view on desktop browsers
 */
const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4 overflow-hidden">
      {/* Mobile container */}
      <div
        id="mobile-container"
        className="w-full max-w-[430px] h-[calc(100vh-2rem)] max-h-[932px] bg-white rounded-3xl shadow-2xl relative isolate"
        style={{ overflow: 'hidden', contain: 'layout' }}
      >
        {/* Phone notch simulation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50"></div>

        {/* App content */}
        <div className="h-full w-full overflow-y-auto">
          {children}
        </div>

        {/* Portal container for modals/dialogs - they will render here instead of body */}
        <div id="mobile-portal-container" className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
          {/* Modals will be portaled here */}
        </div>
      </div>
    </div>
  );
};

export default MobileLayout;
