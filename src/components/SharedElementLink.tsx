"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, MouseEvent } from "react";

interface SharedElementLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  viewTransitionName?: string;
}

export default function SharedElementLink({ 
  href, 
  children, 
  className,
  viewTransitionName 
}: SharedElementLinkProps) {
  const router = useRouter();

  const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Check if View Transitions API is supported
    if ('startViewTransition' in document) {
      // @ts-ignore - View Transitions API
      document.startViewTransition(() => {
        router.push(href);
      });
    } else {
      // Fallback for browsers without View Transitions support
      router.push(href);
    }
  };

  return (
    <Link 
      href={href} 
      onClick={handleClick}
      className={className}
      style={viewTransitionName ? { viewTransitionName } as any : undefined}
    >
      {children}
    </Link>
  );
}