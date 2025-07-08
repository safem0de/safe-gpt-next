"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  // const { status } = useSession();
  // const router = useRouter();

  // useEffect(() => {
  //   if (status === "authenticated") {
  //     router.push("/");
  //   }
  // }, [status, router]);

  // if (status === "loading") return <div>Loading...</div>;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "#f1f5f9"
    }}>
      <h2 className="login-alert text-black">ต้อง login ก่อน</h2>
      <button
        onClick={() => signIn("keycloak")}
        style={{
          padding: "12px 32px",
          fontSize: "1.1rem",
          fontWeight: 600,
          borderRadius: "8px",
          background: "linear-gradient(90deg,#1e293b 60%,#6366f1 100%)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 10px 0 #c7d2fe44",
          transition: "all 0.18s",
        }}
        onMouseOver={e => (e.currentTarget.style.background = "linear-gradient(90deg,#6366f1 0%,#1e293b 100%)")}
        onMouseOut={e => (e.currentTarget.style.background = "linear-gradient(90deg,#1e293b 60%,#6366f1 100%)")}
      >
        🔐 Login with Keycloak
      </button>
    </div>
  );
}
