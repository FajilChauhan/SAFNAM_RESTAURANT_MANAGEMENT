import { MessageCircle } from "lucide-react";
import "./Chatbot.css";

export function Chatbot() {
  return (
    <button className="chatbot" type="button" aria-label="Open chat assistant">
      <MessageCircle size={22} />
    </button>
  );
}
