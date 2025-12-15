"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, User, Loader2 } from "lucide-react";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  lastMessage?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unreadCount: number;
  lastMessageAt?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Handle "to" query param for starting new conversation
  useEffect(() => {
    const toUserId = searchParams.get("to");
    if (toUserId) {
      startConversation(toUserId);
    }
  }, [searchParams]);

  const startConversation = async (otherUserId: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });

      const data = await response.json();
      if (data.success) {
        router.replace(`/messages/${data.data.conversationId}`);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();
        if (data.success) {
          setConversations(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">메시지</h1>
        <p className="text-muted-foreground mt-1">동료와 대화하세요</p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">대화가 없습니다</h3>
            <p className="text-sm text-muted-foreground mt-1">
              동료 프로필에서 메시지를 보내 대화를 시작하세요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link key={conv.id} href={`/messages/${conv.id}`}>
              <Card className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                conv.unreadCount > 0 ? "border-primary/30 bg-primary/5" : ""
              }`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {conv.otherUser.avatar_url ? (
                        <img
                          src={conv.otherUser.avatar_url}
                          alt={conv.otherUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold truncate ${
                          conv.unreadCount > 0 ? "text-foreground" : ""
                        }`}>
                          {conv.otherUser.name}
                        </h3>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}>
                          {conv.lastMessage?.content || "대화를 시작하세요"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge className="ml-2 flex-shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
