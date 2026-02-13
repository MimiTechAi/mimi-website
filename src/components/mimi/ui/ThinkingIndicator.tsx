import React from 'react';

export const ThinkingIndicator = () => {
    return (
        <div className="flex items-center gap-1.5 p-2 opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_0ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_200ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-[bounce_1s_infinite_400ms]" />
        </div>
    );
};
