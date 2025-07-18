"use client";
import React, { createContext, useContext, useState, useMemo } from "react";

type Lang = "th" | "en";

interface LangContextProps {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextProps>({
  lang: "th",
  setLang: () => { },
});

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>("th");

  // ใช้ useMemo เพื่อป้องกัน object ใหม่ทุก render
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
