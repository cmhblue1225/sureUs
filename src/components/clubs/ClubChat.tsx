"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Megaphone, ArrowDown } from "lucide-react";

interface Message {
  id: string;
  club_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

interface ClubChatProps {
  clubId: string;
  currentUserId: string;
  isLeader: boolean;
}

export default function ClubChat({ clubId, currentUserId, isLeader }: ClubChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      // Cleanup subscription on unmount
      const supabase = createClient();
      supabase.channel(`club-chat-${clubId}`).unsubscribe();
    };
  }, [clubId]);

  useEffect(() => {
    // Scroll to bottom on initial load
    if (messages.length > 0 && !cursor) {
      scrollToBottom();
    }
  }, [messages.length, cursor, scrollToBottom]);

  const setupRealtimeSubscription = () => {
    const supabase = createClient();

    supabase
      .channel(`club-chat-${clubId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "club_chat_messages",
          filter: `club_id=eq.${clubId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const newMsg = payload.new as { id: string; sender_id: string };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase
            .from("club_chat_messages")
            .select(`
              *,
              sender:users!club_chat_messages_sender_id_fkey(id, name, avatar_url)
            `)
            .eq("id", newMsg.id)
            .single() as any);

          if (data) {
            setMessages((prev) => {
              // Check if message already exists
              if (prev.some((m) => m.id === data.id)) {
                return prev;
              }
              return [...prev, data];
            });

            // Auto-scroll if near bottom
            if (messagesContainerRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
              if (isNearBottom || newMsg.sender_id === currentUserId) {
                setTimeout(scrollToBottom, 100);
              } else {
                setShowScrollButton(true);
              }
            }
          }
        }
      )
      .subscribe();
  };

  const fetchMessages = async (beforeCursor?: string) => {
    try {
      if (!beforeCursor) {
        setIsLoading(true);
      }

      const cursorParam = beforeCursor ? `&before=${beforeCursor}` : "";
      const response = await fetch(`/api/clubs/${clubId}/chat?limit=50${cursorParam}`);
      const result = await response.json();

      if (!result.success) {
        console.error("Failed to fetch messages:", result.error);
        return;
      }

      if (beforeCursor) {
        setMessages((prev) => [...result.data.messages, ...prev]);
      } else {
        setMessages(result.data.messages);
      }
      setHasMore(result.data.hasMore);
      setCursor(result.data.cursor);
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/clubs/${clubId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      const result = await response.json();

      if (!result.success) {
        console.error("Failed to send message:", result.error);
        return;
      }

      setNewMessage("");
      // Message will be added via realtime subscription
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

    // Show scroll button if not near bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);

    // Load more messages if scrolled to top
    if (scrollTop === 0 && hasMore && !isLoading && cursor) {
      fetchMessages(cursor);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return `어제 ${date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-card border rounded-lg overflow-hidden">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
      >
        {hasMore && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => cursor && fetchMessages(cursor)}
              disabled={isLoading}
            >
              이전 메시지 불러오기
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>아직 메시지가 없습니다.</p>
            <p className="text-sm">첫 번째 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === currentUserId;
            const showAvatar =
              index === 0 || messages[index - 1].sender_id !== message.sender_id;

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}
              >
                {!isOwnMessage && showAvatar && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender.avatar_url || undefined} />
                    <AvatarFallback>
                      {message.sender.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!isOwnMessage && !showAvatar && <div className="w-8" />}

                <div
                  className={`flex flex-col max-w-[70%] ${
                    isOwnMessage ? "items-end" : "items-start"
                  }`}
                >
                  {!isOwnMessage && showAvatar && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {message.sender.name}
                    </span>
                  )}
                  <div
                    className={`rounded-lg px-3 py-2 ${
                      message.type === "announcement"
                        ? "bg-yellow-500/10 border border-yellow-500/30"
                        : isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.type === "announcement" && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 mb-1">
                        <Megaphone className="h-3 w-3" />
                        공지
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatTime(message.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="absolute bottom-20 right-4">
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full shadow-lg"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Input */}
      <form
        onSubmit={handleSend}
        className="border-t p-4 flex items-center gap-2"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1"
          disabled={isSending}
        />
        <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
