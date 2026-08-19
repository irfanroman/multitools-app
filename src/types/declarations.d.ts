declare module 'next' {
  export interface NextConfig {
    [key: string]: any;
  }
  export interface Metadata {
    [key: string]: any;
  }
}

declare module 'next/link' {
  import React from 'react';
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
    children?: React.ReactNode;
  }
  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}

declare module 'next/navigation' {
  export function usePathname(): string;
  export function useRouter(): any;
  export function useSearchParams(): any;
}

declare module 'next/font/google' {
  export function Plus_Jakarta_Sans(options: any): any;
  export function Sora(options: any): any;
  export function Inter(options: any): any;
}
