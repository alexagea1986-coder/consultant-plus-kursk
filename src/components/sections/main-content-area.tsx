"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BookOpen, MessageCircle, Send, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import SearchChatInterface from "./search-chat-interface";

interface MainContentAreaProps {
  anonymousLoggedIn: boolean;
  onAnonymousLogin?: () => void;
  selectedProfile: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MainContentArea({
  anonymousLoggedIn,
  onAnonymousLogin,
  selectedProfile,
}: {
  anonymousLoggedIn: boolean;
  onAnonymousLogin: () => void;
  selectedProfile: string;
}) {
  return (
    <div className="space-y-6">
      <SearchChatInterface
        anonymousLoggedIn={anonymousLoggedIn}
        onAnonymousLogin={onAnonymousLogin}
        selectedProfile={selectedProfile}
      />
    </div>
  );
}