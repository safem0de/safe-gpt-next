// Sidebar.tsx
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTimes,
  faPlus,
  faComments,
  faBackward,
} from "@fortawesome/free-solid-svg-icons";

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  return (
    <aside
      className={`
        bg-white border-r border-gray-200 shadow-sm
        transition-all duration-200
        ${open ? "w-64" : "w-16"}
        h-full flex flex-col
      `}
      style={{ minHeight: "100%" }}
    >
      {/* ปุ่ม Hamburger / Close */}
      <div className="px-3 overflow-y-auto">
        <button
          className="w-full px-2 py-2 rounded hover:bg-gray-100 text-left text-gray-800 flex items-center gap-2 cursor-pointer"
          onClick={() => setOpen((v) => !v)}
        >
          <FontAwesomeIcon icon={open ? faBackward : faBars} />
          {open && "ซ่อนแถบข้าง"}
        </button>
      </div>
      <div className="p-3 flex-1 overflow-y-auto">
        <button
          className="w-full px-2 py-2 rounded hover:bg-gray-100 text-left text-gray-800 flex items-center gap-2 cursor-pointer"
          onClick={() => alert("สร้างแชทใหม่")}
        >
          <FontAwesomeIcon icon={faComments} />
          {open && "แชทใหม่"}
        </button>
        <hr className="my-3" />
        <div className="text-xs text-gray-500 mb-2">{open && "ประวัติแชท"}</div>
        <ul className="space-y-2">
          <li className="truncate cursor-pointer p-2 rounded hover:bg-blue-100">
            {open && "สร้างเว็บด้วย Keycloak"}
          </li>
          <li className="truncate cursor-pointer p-2 rounded hover:bg-blue-100">
            {open && "เริ่มใช้ Keycloak"}
          </li>
        </ul>
      </div>
    </aside>
  );
}
