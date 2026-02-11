"use client";

import { useState } from "react";
import { Play } from "lucide-react";

type YouTubeEmbedProps = {
    videoId: string;
    title: string;
    className?: string;
};

export default function YouTubeEmbed({ videoId, title, className }: YouTubeEmbedProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
    const posterSrc = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return (
        <div className={className}>
            <div
                data-testid="youtube-embed"
                className="relative w-full aspect-video overflow-hidden rounded-2xl bg-black/30 border border-border-subtle"
            >
                {isLoaded ? (
                    <iframe
                        data-testid="youtube-iframe"
                        className="absolute inset-0 h-full w-full"
                        src={embedSrc}
                        title={title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                ) : (
                    <button
                        data-testid="youtube-play-button"
                        type="button"
                        onClick={() => setIsLoaded(true)}
                        aria-label={`Video abspielen: ${title}`}
                        className="group absolute inset-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void"
                    >
                        <img
                            src={posterSrc}
                            alt=""
                            className="h-full w-full object-cover opacity-90"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/60 border border-white/15 text-white transition-colors group-hover:bg-black/70 group-hover:border-white/25">
                                <Play className="h-6 w-6" />
                                <span className="sr-only">Video abspielen</span>
                            </span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}
