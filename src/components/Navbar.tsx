"use client";

import { SITE } from "@/constants/site";
import AvatarDropdown from "@/components/AvatarDropdown";
import { TH, EN } from "@/constants/lang";
import { useLang } from "@/contexts/LangContext";

export default function Navbar() {
  const { lang, setLang } = useLang();
  const t = lang === "th" ? TH : EN;

  const handleLangToggle = () => {
    const newLang = lang === "th" ? "en" : "th";
    console.log("เปลี่ยนเป็นภาษา:", newLang); // log ค่าที่เลือก
    setLang(newLang);
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
        <AvatarDropdown
          email="n.wangwanich@gmail.com"
          avatarUrl="https://api.dicebear.com/7.x/identicon/svg?seed=plus"
          onLogout={() => alert(t.logout)}
        />
      </div>
    </nav>
  );
}
