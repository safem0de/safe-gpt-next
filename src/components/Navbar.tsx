"use client";

import { SITE } from "@/constants/site";
import AvatarDropdown from "@/components/AvatarDropdown";
import { useLang } from "@/contexts/LangContext";
import { signOut, useSession } from "next-auth/react";
import { useChatStore } from "@/store/chat-store";

export default function Navbar() {
  const { data: session, status } = useSession();
  const { lang, setLang } = useLang();
  const ragEnabled = useChatStore((s) => s.ragEnabled);
  const toggleRag = useChatStore((s) => s.toggleRag);

  const handleLangToggle = () => {
    const newLang = lang === "th" ? "en" : "th";
    console.log("เปลี่ยนเป็นภาษา:", newLang); // log ค่าที่เลือก
    setLang(newLang);
  };

  const handleLogout = async () => {
    // Logout from NextAuth first
    await signOut({ redirect: false });

    // Then redirect to Keycloak logout URL
    const keycloakLogoutUrl = process.env.NEXT_PUBLIC_KEYCLOAK_LOGOUT_URL;
    if (keycloakLogoutUrl) {
      window.location.href = keycloakLogoutUrl;
    } else {
      // Fallback to home page if no Keycloak logout URL
      window.location.href = "/";
    }
  };

  return (
    <nav
      className="w-full h-14 flex items-center justify-between px-4 shadow-md"
      style={{ backgroundColor: SITE.navbarBg }}
    >
      <span
        className="font-bold text-2xl hidden sm:inline"
        style={{ color: SITE.navbarText }}
      >
        {SITE.title}
      </span>
      <button
        onClick={toggleRag}
        className="px-3 py-1 rounded bg-slate-600 hover:bg-slate-500"
      >
        {ragEnabled ? "RAG Mode ✅" : "Normal Mode ❌"}
      </button>

      <div className="ml-auto flex items-center gap-4">
        {/* Toggle Switch Language */}
        <div className="relative inline-block w-16 h-7">
          <input
            id="lang-switch"
            type="checkbox"
            checked={lang === "en"}
            onChange={handleLangToggle}
            className="peer appearance-none w-16 h-7 bg-slate-100 rounded-full checked:bg-slate-800 cursor-pointer transition-colors duration-300 outline-none"
          />
          <label
            htmlFor="lang-switch"
            className="absolute top-0 left-0 w-7 h-7 bg-white rounded-full border border-slate-300 shadow-sm transition-transform duration-300 peer-checked:translate-x-9 peer-checked:border-slate-800 cursor-pointer flex items-center justify-center text-xs"
          >
            {lang === "th" ? "TH" : "EN"}
          </label>
        </div>
        {status === "authenticated" && session?.user && (
          <AvatarDropdown
            user={session.user}
            menu={[
              {
                label: lang === "th" ? "โปรไฟล์" : "Profile",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                onClick: () => {
                  // Navigate to profile page
                  console.log("Navigate to profile");
                },
              },
              {
                label: lang === "th" ? "ตั้งค่า" : "Settings",
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                onClick: () => {
                  // Navigate to settings page
                  console.log("Navigate to settings");
                },
              },
            ]}
            onLogout={handleLogout}
          />
        )}
        {status === "unauthenticated" && (
          <button
            onClick={() => window.location.href = "/api/auth/signin"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {lang === "th" ? "เข้าสู่ระบบ" : "Sign In"}
          </button>
        )}
      </div>
    </nav>
  );
}
