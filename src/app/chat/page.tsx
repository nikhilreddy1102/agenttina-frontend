"use client";

import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: "user", text: input };

    // Add user message
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    // Fake assistant reply
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        text:
          "This is a dummy response. Later, this will be connected to your real AI agent.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
    }, 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-100">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat with Assistant</h1>
        <p className="text-gray-600 text-sm">
          Ask about jobs, matches, skills, or your resume. (Dummy chat for now)
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-inner p-4 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm text-center mt-10">
            Start the conversation by typing a message below.
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Avatar */}
            {msg.role === "assistant" && (
              <div className="mr-2 flex items-end">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                  AI
                </div>
              </div>
            )}

            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-100 text-gray-900 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>

            {msg.role === "user" && (
              <div className="ml-2 flex items-end">
                <div className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-xs">
                  U
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isThinking && (
          <div className="flex items-center mt-2">
            <div className="mr-2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
              AI
            </div>
            <div className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-2xl rounded-bl-none inline-flex items-center gap-2">
              <span>Thinking</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Type your message and press Enter or click Send..."
        />
        <button
          onClick={sendMessage}
          className="px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800"
        >
          Send
        </button>
      </div>
    </div>
  );
}


