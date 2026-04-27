'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Philippine Peso Sign (₱) icon — drop-in replacement for DollarSign.
 * Mirrors the Lucide DollarSign style: 24×24 viewBox, stroke-based.
 */
export function PesoSign({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('lucide', className)}
      {...props}
    >
      <line x1="11" y1="3" x2="11" y2="21" />
      <line x1="9" y1="6" x2="17" y2="6" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <path d="M9 6c0 0 0 2 2 2s2-2 2-2" />
      <path d="M9 12c0 0 0 3 3 3h1a3 3 0 1 1-3 3" />
    </svg>
  );
}

/**
 * Philippine Peso Sign inside a circle — drop-in replacement for CircleDollarSign.
 * Mirrors the Lucide CircleDollarSign style: 24×24 viewBox, stroke-based.
 */
export function CirclePesoSign({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('lucide', className)}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="11" y1="6" x2="11" y2="18" />
      <line x1="9" y1="8.5" x2="15" y2="8.5" />
      <line x1="9" y1="13" x2="14" y2="13" />
      <path d="M9 8.5c0 0 0 1.5 2 1.5s2-1.5 2-1.5" />
      <path d="M9 13c0 0 0 2 2.5 2h0.5a2.5 2.5 0 1 1-2.5 2.5" />
    </svg>
  );
}
