"use client";
import { useRef, useState, useEffect } from "react";
import { TH, EN } from "@/constants/lang";
import { useLang } from "@/contexts/LangContext";

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

interface AvatarDropdownProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  menu?: MenuItem[];
  onLogout: () => void;
}

export default function AvatarDropdown({
  user,
  menu,
  onLogout,
}: Readonly<AvatarDropdownProps>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const t = lang === "th" ? TH : EN;

  // Generate avatar URL from email or name
  const avatarUrl = user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || "User")}`;
  const displayName = user.name || user.email || "User";
  const displayEmail = user.email || "";

  // ปิด dropdown ถ้าคลิกข้างนอก
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="focus:outline-none">
        <img
          src={avatarUrl}
          alt="avatar"
          className="w-10 h-10 rounded-full border-2 border-white shadow cursor-pointer"
        />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="font-semibold text-gray-900 truncate">{displayName}</div>
            {displayEmail && (
              <div className="text-xs text-gray-500 truncate mt-1">{displayEmail}</div>
            )}
          </div>
          {menu?.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                disabled={item.disabled}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 text-gray-800 ${item.disabled ? "opacity-60 cursor-not-allowed" : ""
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">{t.logout}</span>
          </button>
        </div>
      )}
    </div>
  );
}
