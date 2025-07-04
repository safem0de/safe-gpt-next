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
  email: string;
  avatarUrl: string;
  menu?: MenuItem[];
  onLogout: () => void;
}

export default function AvatarDropdown({
  email,
  avatarUrl,
  menu,
  onLogout,
}: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const t = lang === "th" ? TH : EN;

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
          <div className="px-4 py-2 text-gray-800 text-sm border-b">
            <div className="font-medium truncate">{email}</div>
          </div>
          {menu &&
            menu.map((item, idx) => (
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
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-500 hover:bg-gray-100"
          >
            <span>{t.logout}</span>
          </button>
        </div>
      )}
    </div>
  );
}
