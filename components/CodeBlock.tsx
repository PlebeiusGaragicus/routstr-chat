"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useTheme } from "next-themes";

interface CodeBlockProps {
  children: string;
  className?: string;
  inline?: boolean;
}

export default function CodeBlock({
  children,
  className,
  inline,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const syntaxTheme = isDark ? oneDark : oneLight;
  const backgroundColor = isDark ? "#09090b" : "#fafafa";

  // Extract language from className (format: "language-javascript")
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // For inline code, render simple styled span
  if (inline) {
    return (
      <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border not-prose">
        {children}
      </code>
    );
  }

  // For code blocks, render with syntax highlighting and copy button
  return (
    <div className="relative group my-4 not-prose">
      <div className="flex items-center justify-between bg-muted px-4 py-2 rounded-t-lg border border-border border-b-0">
        <span className="text-xs text-muted-foreground font-medium tracking-wide">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="rounded-b-lg overflow-hidden border border-border border-t-0">
        <SyntaxHighlighter
          style={syntaxTheme}
          language={language || "text"}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "16px",
            background: backgroundColor,
            fontSize: "13px",
            lineHeight: "1.6",
            borderRadius: 0,
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            },
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
