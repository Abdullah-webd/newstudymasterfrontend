'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MarkdownRenderer({ content, className = "" }) {
    // Basic cleanup for markdown that might be missing spaces after '#'
    const safeContent = (content || "").replace(/(#+)([^#\s])/g, '$1 $2');

    return (
        <div className={`markdown-content w-full ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-md font-bold my-2" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900" {...props} />,
                    blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-indigo-200 pl-4 py-1 my-4 italic text-gray-700" {...props} />
                    ),
                    code: ({ node, inline, ...props }) => (
                        inline
                            ? <code className="bg-gray-100 rounded px-1 py-0.5 text-indigo-600 font-mono text-sm" {...props} />
                            : <code className="block bg-gray-50 border border-gray-100 rounded-xl p-4 my-4 font-mono text-sm overflow-x-auto" {...props} />
                    ),
                    hr: () => <hr className="my-6 border-gray-100" />,
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
}
