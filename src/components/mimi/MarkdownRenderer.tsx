"use client";

/**
 * MIMI Agent - Markdown Renderer V2.0 (FULL VERSION)
 * 
 * Features:
 * - GitHub Flavored Markdown (GFM)
 * - Syntax Highlighting für Code (One Dark)
 * - LaTeX/KaTeX für Mathematik (VOLL FUNKTIONAL)
 * - Copy Button für Code-Blöcke
 * - Responsive Tables
 */

import React, { useState, memo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Code Block mit Copy Button
 */
const CodeBlock = memo(function CodeBlock({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
    const [copied, setCopied] = useState(false);

    const codeContent = String(children).replace(/\n$/, "");
    const language = className?.replace("language-", "") || "text";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codeContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    return (
        <div className="relative group my-4">
            {/* Language Badge */}
            <div className="absolute top-0 left-0 px-2 py-1 text-xs font-mono text-white/50 bg-white/5 rounded-tl-lg rounded-br-lg">
                {language}
            </div>

            {/* Copy Button */}
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Code kopieren"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                ) : (
                    <Copy className="w-4 h-4 text-white/70" />
                )}
            </button>

            {/* Code */}
            <pre className="overflow-x-auto p-4 pt-8 rounded-xl bg-black/60 border border-white/10">
                <code className={cn("text-sm font-mono", className)} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    );
});

/**
 * Inline Code
 */
const InlineCode = memo(function InlineCode({
    children,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return (
        <code
            className="px-1.5 py-0.5 rounded bg-white/10 text-brand-cyan font-mono text-sm"
            {...props}
        >
            {children}
        </code>
    );
});

/**
 * Main Markdown Renderer Component
 * Mit vollem LaTeX Support (remark-math + rehype-katex)
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
    content,
    className
}: MarkdownRendererProps) {
    return (
        <div className={cn("markdown-body prose prose-invert max-w-none", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={{
                    // Code Blocks - detect inline by checking position
                    code({ node, className, children, ...props }) {
                        // In react-markdown v9+, inline code has no <pre> parent
                        const isInline = !node?.position ||
                            (node.position.start.line === node.position.end.line &&
                                !String(children).includes('\n'));

                        if (isInline) {
                            return <InlineCode {...props}>{children}</InlineCode>;
                        }
                        return (
                            <CodeBlock className={className} {...props}>
                                {children}
                            </CodeBlock>
                        );
                    },

                    // Links
                    a({ href, children, ...props }) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-cyan hover:text-brand-cyan/80 underline underline-offset-2"
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    },

                    // Tables
                    table({ children, ...props }) {
                        return (
                            <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
                                <table className="w-full text-sm" {...props}>
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    th({ children, ...props }) {
                        return (
                            <th className="px-4 py-2 bg-white/5 text-left font-semibold border-b border-white/10" {...props}>
                                {children}
                            </th>
                        );
                    },
                    td({ children, ...props }) {
                        return (
                            <td className="px-4 py-2 border-b border-white/5" {...props}>
                                {children}
                            </td>
                        );
                    },

                    // Blockquotes
                    blockquote({ children, ...props }) {
                        return (
                            <blockquote
                                className="my-4 pl-4 border-l-4 border-brand-cyan/50 text-white/70 italic"
                                {...props}
                            >
                                {children}
                            </blockquote>
                        );
                    },

                    // Lists
                    ul({ children, ...props }) {
                        return (
                            <ul className="my-2 ml-4 list-disc list-outside space-y-1" {...props}>
                                {children}
                            </ul>
                        );
                    },
                    ol({ children, ...props }) {
                        return (
                            <ol className="my-2 ml-4 list-decimal list-outside space-y-1" {...props}>
                                {children}
                            </ol>
                        );
                    },

                    // Headings
                    h1({ children, ...props }) {
                        return <h1 className="text-2xl font-bold mt-6 mb-3 text-white" {...props}>{children}</h1>;
                    },
                    h2({ children, ...props }) {
                        return <h2 className="text-xl font-bold mt-5 mb-2 text-white" {...props}>{children}</h2>;
                    },
                    h3({ children, ...props }) {
                        return <h3 className="text-lg font-semibold mt-4 mb-2 text-white" {...props}>{children}</h3>;
                    },

                    // Paragraphs
                    p({ children, ...props }) {
                        return <p className="my-2 leading-relaxed" {...props}>{children}</p>;
                    },

                    // Horizontal Rule
                    hr({ ...props }) {
                        return <hr className="my-6 border-white/10" {...props} />;
                    },

                    // Strong/Bold
                    strong({ children, ...props }) {
                        return <strong className="font-bold text-white" {...props}>{children}</strong>;
                    },

                    // Emphasis/Italic
                    em({ children, ...props }) {
                        return <em className="italic text-white/90" {...props}>{children}</em>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
});

export default MarkdownRenderer;
