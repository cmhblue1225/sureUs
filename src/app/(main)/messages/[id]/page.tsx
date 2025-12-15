"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface ConversationDetail {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string;
    department?: string;
    jobRole?: string;
  };
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userRes = await fetch("/api/user");
        const userData = await userRes.json();
        if (userData.success) {
          setCurrentUserId(userData.data.id);
        }

        // Get conversation details
        const convRes = await fetch(`/api/conversations/${conversationId}`);
        const convData = await convRes.json();
        if (convData.success) {
          setConversation(convData.data);
        } else {
          router.push("/messages");
          return;
        }

        // Get messages
        const msgRes = await fetch(`/api/conversations/${conversationId}/messages`);
        const msgData = await msgRes.json();
        if (msgData.success) {
          setMessages(msgData.data.messages);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchData();
    }
  }, [conversationId, router]);

  // Poll for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}/messages`);
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages);
        }
      } catch (error) {
        console.error("Poll error:", error);
      }
    };

    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    // Optimistically add message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (data.success) {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id ? data.data : msg
          )
        );
      } else {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );
        setNewMessage(content);
      }
    } catch (error) {
      console.error("Send error:", error);
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
      setNewMessage(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const shouldShowDate = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].created_at).toDateString();
    const previous = new Date(messages[index - 1].created_at).toDateString();
    return current !== previous;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">대화를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/messages")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Link href={`/profile/${conversation.otherUser.id}`} className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {conversation.otherUser.avatar_url ? (
              <img
                src={conversation.otherUser.avatar_url}
                alt={conversation.otherUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="font-semibold">{conversation.otherUser.name}</h2>
            {conversation.otherUser.department && (
              <p className="text-xs text-muted-foreground">
                {conversation.otherUser.department}
                {conversation.otherUser.jobRole && ` / ${conversation.otherUser.jobRole}`}
              </p>
            )}
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">대화를 시작하세요</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={message.id}>
              {shouldShowDate(index) && (
                <div className="text-center my-4">
                  <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              )}
              <div
                className={`flex ${
                  message.sender_id === currentUserId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    message.sender_id === currentUserId
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      message.sender_id === currentUserId
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="p-2">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
