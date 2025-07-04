// components/Sidebar.tsx

"use client";
import { TH, EN } from "@/constants/lang";
import { useLang } from "@/contexts/LangContext";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faComments,
  faBackward,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
// import type { ChatHistory } from "@/types/chat";
import { useChatStore } from "@/store/chat-store";

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  // const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const { lang } = useLang();
  const t = lang === "th" ? TH : EN;
  const chatHistory = useChatStore(s => s.chatHistory);
  const fetchChatHistory = useChatStore(s => s.fetchChatHistory);

  // useEffect ดึงข้อมูลตอน mount
  useEffect(() => {
    fetchChatHistory('user-123');
  }, []);

  async function handleSelectChat(chatId: string) {
    // ดึง messages จาก backend ด้วย chatId
    const res = await fetch(`/api/chats/${chatId}`);
    const data = await res.json();
    if (data.success && data.chat) {
      setActiveChat(chatId, data.chat.messages);
    }
  }

  async function handleCreateNewChat() {
    // 1. ส่ง POST เพื่อสร้างแชทใหม่ (ไม่ต้องมีข้อความก็ได้)
    const res = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        messages: [],
        title: `แชทใหม่ ${new Date().toLocaleString("th-TH")}`,
      }),
    });
    const data = await res.json();
    if (data.success && data.chat) {
      // 2. อัปเดตหน้าจอให้เป็นแชทใหม่นี้
      setActiveChat(data.chat._id, []);
      // 3. ดึง history sidebar ใหม่ (หรือจะ push แชทใหม่เข้า store ก็ได้)
      await fetchChatHistory('user-123');
    }
  }

  async function handleDeleteChat(chatId: string) {
    if (!confirm("ต้องการลบแชทนี้จริงหรือไม่?")) return;
    const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      const currentChatId = useChatStore.getState().chatId;
      await fetchChatHistory('user-123');
      if (currentChatId === chatId) {
        useChatStore.getState().setActiveChat(null, []);
      }
    } else {
      alert(data.error || "ลบไม่สำเร็จ");
    }
  }

  // เพิ่ม auto collapse เมื่อจอเล็ก
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 640) { // ใช้ breakpoint sm (640px)
        setOpen(false);
      } else {
        // setOpen(true); // ไม่ต้องทำอะไรเลย
      }
    }
    handleResize(); // เรียกครั้งแรกตอน mount

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadHistory() {
      await fetchChatHistory('user-123');
    }
    loadHistory();
  }, []);

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
          <FontAwesomeIcon icon={open ? faBackward : faBars} className="w-4" />
          {open && t.hiddensidebar}
        </button>
      </div>
      <div className="p-3 flex-1 overflow-y-auto">
        <button
          className="w-full px-2 py-2 rounded hover:bg-gray-100 text-left text-gray-800 flex items-center gap-2 cursor-pointer"
          onClick={handleCreateNewChat}
        >
          <FontAwesomeIcon icon={faComments} className="w-4" />
          {open && t.createnewchat}
        </button>
        <hr className="my-3" />
        <div className="text-xs text-gray-500 mb-2">{open && t.chathistory}</div>
        <ul className="space-y-2">

          {/* {chatHistory.map((chat) => (
            <li
              key={chat._id}
              className="truncate cursor-pointer p-2 rounded hover:bg-blue-100 text-black"
              title={chat.title}
              onClick={() => handleSelectChat(chat._id)}
            >
              {open && chat.title}
            </li>
          ))} */}

          {open && chatHistory.map((chat) => (
            <li
              key={chat._id}
              className="truncate cursor-pointer p-2 rounded hover:bg-blue-100 text-black flex items-center justify-between"
              title={chat.title}
              onClick={() => handleSelectChat(chat._id)}
            >
              <span className="flex-1 truncate">{open && chat.title}</span>
              {/* ปุ่มลบ */}
              <button
                className="ml-2 p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
                title="Delete chat"
                onClick={e => {
                  e.stopPropagation(); // กันไม่ให้ onClick แถว chat trigger
                  handleDeleteChat(chat._id);
                }}
              >
                <FontAwesomeIcon icon={faTrash} className="w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
