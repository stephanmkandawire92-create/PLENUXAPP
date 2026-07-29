declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'next' {
  export type Metadata = any;
  export type Viewport = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
  export interface NextConfig {
    [key: string]: any;
  }
  export default function next(options?: any): any;
}

declare module 'next/types' {
  export type Metadata = any;
  export type Viewport = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module 'next/types.js' {
  export type Metadata = any;
  export type Viewport = any;
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module 'next/server' {
  export class NextRequest extends Request {
    [key: string]: any;
  }
  export class NextResponse extends Response {
    static json(body?: any, init?: any): any;
    static next(init?: any): any;
    static redirect(url: string | URL, status?: number): any;
    static rewrite(url: string | URL, options?: any): any;
    [key: string]: any;
  }
}

declare module 'next/server.js' {
  export class NextRequest extends Request {
    [key: string]: any;
  }
  export class NextResponse extends Response {
    static json(body?: any, init?: any): any;
    static next(init?: any): any;
    static redirect(url: string | URL, status?: number): any;
    static rewrite(url: string | URL, options?: any): any;
    [key: string]: any;
  }
}

declare module 'next/link' {
  const Link: any;
  export default Link;
}

declare module 'next/navigation' {
  export function useRouter(): any;
  export function usePathname(): any;
  export function useSearchParams(): any;
  export function redirect(url: string): void;
  export function notFound(): void;
}

declare module 'next/font/google' {
  export const Inter: any;
  export const Roboto: any;
  export const Outfit: any;
  export const Geist: any;
  export const Geist_Mono: any;
}

declare module 'lucide-react' {
  const content: any;
  export default content;
  export const Network: any;
  export const MessageSquare: any;
  export const Compass: any;
  export const Briefcase: any;
  export const Settings: any;
  export const Search: any;
  export const TrendingUp: any;
  export const CheckCircle2: any;
  export const ShieldCheck: any;
  export const Sparkles: any;
  export const ChevronUp: any;
  export const Zap: any;
  export const Activity: any;
  export const Globe: any;
  export const Bell: any;
  export const Filter: any;
  export const Clock: any;
  export const Users: any;
  export const Award: any;
  export const BarChart3: any;
  export const Eye: any;
  export const LogOut: any;
  export const Menu: any;
  export const X: any;
  export const Mail: any;
  export const Lock: any;
  export const User: any;
  export const Loader2: any;
  export const GitBranch: any;
}
