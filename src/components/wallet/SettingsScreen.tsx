import React, { useState } from "react";
import { useWeb3Auth } from "@/context/Web3AuthContext";

interface SettingsScreenProps {
  onClose: () => void;
  onLogout: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onLogout }) => {
  const { userInfo } = useWeb3Auth();
  const [language, setLanguage] = useState("English");
  
  const settingsItems = [
    {
      id: "personal",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      title: "Personal information",
      rightContent: null,
      onClick: () => console.log("Personal information clicked")
    },
    {
      id: "language",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
      ),
      title: "Language",
      rightContent: language,
      onClick: () => {
        const newLanguage = language === "English" ? "Español" : "English";
        setLanguage(newLanguage);
      }
    },
    {
      id: "privacy",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      title: "Privacy Policy",
      rightContent: null,
      onClick: () => window.open("https://aptos.dev/privacy", "_blank")
    },
    {
      id: "help",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      ),
      title: "Help center",
      rightContent: null,
      onClick: () => window.open("https://aptos.dev/guides/getting-started", "_blank")
    },
    {
      id: "setting",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
      title: "Setting",
      rightContent: null,
      onClick: () => console.log("Settings clicked")
    },
  ];

  const getInitials = (name: string) => {
    if (!name) return "CC";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-[85vh] bg-white flex flex-col overflow-hidden rounded-xl shadow-lg">
        {/* Header */}
        <div className="p-4 flex items-center border-b border-gray-200">
          <button onClick={onClose} className="text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"></path>
            </svg>
          </button>
          <h2 className="text-lg font-semibold mx-auto">Account</h2>
          <div className="w-8"></div>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* User profile section */}
          <div className="flex items-center p-5 border-b border-gray-200">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold mr-4">
              {getInitials(userInfo?.name || "")}
            </div>
            <div>
              <h3 className="font-medium">{userInfo?.name || "Claudio Condor"}</h3>
              <p className="text-sm text-yellow-600">{userInfo?.email || "claucondor@gmail.com"}</p>
            </div>
          </div>

          {/* Settings items */}
          <div>
            {settingsItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center p-5 border-b border-gray-100 cursor-pointer"
                onClick={item.onClick}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-4 text-gray-600">
                  {item.icon}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{item.title}</span>
                  <div className="flex items-center">
                    {item.rightContent && (
                      <span className="text-gray-500 mr-2">{item.rightContent}</span>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Logout Button at bottom */}
        <div className="p-4">
          <button
            onClick={onLogout}
            className="w-full p-3 rounded-xl text-black font-medium border border-gray-300"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen; 