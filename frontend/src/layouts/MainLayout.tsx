import { Outlet } from "react-router-dom";
import { Chatbot } from "../components/chatbot/Chatbot";
import { Navbar } from "../components/navbar/Navbar";
import "./MainLayout.css";

export function MainLayout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout__main">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  );
}
