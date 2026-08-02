import React from 'react';
import { IoMedicalOutline } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ role, text, timestamp }) => {
  const isDoctor = role === 'assistant';

  return (
    <div className={`flex ${isDoctor ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] gap-2 sm:max-w-[72%] ${isDoctor ? 'items-end' : 'items-end'}`}>
        {isDoctor && (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <IoMedicalOutline size={14} />
          </div>
        )}
        <div>
          <div
            className={`rounded-2xl px-4 py-3 shadow-[0_18px_35px_rgba(2,6,23,0.18)] ${
              isDoctor
                ? 'rounded-bl-md border border-slate-700/70 bg-slate-800/90 text-slate-50'
                : 'rounded-br-md border border-emerald-500/30 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
            }`}
          >
            {isDoctor ? (
              <div className="prose prose-invert prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1 [&_p]:leading-6 [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-6 sm:text-[15px]">{text}</p>
            )}
          </div>
          {timestamp && (
            <p className={`mt-1 text-[10px] text-slate-500 ${isDoctor ? 'text-left' : 'text-right'}`}>
              {formatTime(timestamp)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
