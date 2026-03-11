import MarkdownRenderer from './MarkdownRenderer';

export default function ChatMessage({ type, content }) {
  if (type === 'context') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-[75%] bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm p-4">
          <p className="text-xs text-gray-500 mb-1 font-medium">Context</p>
          <p className="text-sm text-gray-800 leading-relaxed font-outfit">{content}</p>
        </div>
      </div>
    );
  }

  if (type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-md shadow-indigo-100">
          <p className="text-sm leading-relaxed font-outfit">{content}</p>
        </div>
      </div>
    );
  }

  if (type === 'ai') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] sm:max-w-[75%] bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm p-4">
          <MarkdownRenderer content={content} className="text-sm text-gray-800" />
        </div>
      </div>
    );
  }
}
