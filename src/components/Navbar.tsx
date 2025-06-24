"use client";

import { SITE } from "@/constants/site";
import AvatarDropdown from "@/components/AvatarDropdown";

export default function Navbar() {
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
      <div className="ml-auto flex items-center">
        <AvatarDropdown
          email="n.wangwanich@gmail.com"
          avatarUrl="https://api.dicebear.com/7.x/identicon/svg?seed=plus"
          onLogout={() => alert("Logout")}
        />
      </div>
    </nav>
  );
}
