"use client";

import { useState } from 'react';
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface InfoTooltipProps {
  title: string;
  content: string;
  children: React.ReactNode;
}

export default function InfoTooltip({ title, content, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={() => setOpen(true)}
          aria-label={`Informationen über ${title}`}
        >
          <Info className="h-4 w-4 text-white" />
          <span className="sr-only">Informationen über {title}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-card/90 backdrop-blur-sm border-primary/20" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="grid gap-2">
          <h4 className="font-semibold leading-none text-white">{title}</h4>
          <p className="text-sm text-white/90">
            {content}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}