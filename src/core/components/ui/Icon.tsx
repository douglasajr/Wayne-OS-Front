/**
 * Iconos SVG inline. Sin libreria: son una docena y asi no se arrastran
 * cientos de KB al bundle por seis trazos.
 */
export type IconName =
  | 'home' | 'utensils' | 'car' | 'plug' | 'laptop' | 'sparkles'
  | 'heart-pulse' | 'graduation-cap' | 'shirt' | 'gift' | 'landmark'
  | 'ellipsis' | 'banknote' | 'wallet' | 'list' | 'chart' | 'target'
  | 'plus' | 'check' | 'alert' | 'warn' | 'siren' | 'ant' | 'repeat'
  | 'arrow-up' | 'arrow-down' | 'arrow-right' | 'out' | 'in'
  | 'shield' | 'card' | 'moon' | 'sun' | 'eye' | 'eye-off' | 'logout' | 'user'
  | 'x' | 'search' | 'trash' | 'pencil' | 'filter' | 'calendar' | 'archive'
  | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'scale' | 'inbox' | 'piggy';

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5',
  utensils: 'M4 3v7a3 3 0 0 0 6 0V3M7 10v11M17 3c-1.5 2-2 4-2 6s.5 3 2 3 2-1 2-3-.5-4-2-6zM17 12v9',
  car: 'M5 17h14M4 17v-4l2-5h12l2 5v4M4 17v2h3v-2M17 17v2h3v-2M7 13h.01M17 13h.01',
  plug: 'M9 3v6M15 3v6M6 9h12v3a6 6 0 0 1-12 0V9zM12 18v3',
  laptop: 'M4 6h16v10H4zM2 19h20',
  sparkles: 'm12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18 16l.9 2.1L21 19l-2.1.9L18 22l-.9-2.1L15 19l2.1-.9z',
  'heart-pulse': 'M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 1.3-.6 2.6-1.5 3.8M3 13h3l2-3 2.5 6 2-4 1.5 2h5',
  'graduation-cap': 'm12 4 9 4.5-9 4.5-9-4.5zM7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11M21 8.5V14',
  shirt: 'M8 3 4 5.5 6 10l2-1v11h8V9l2 1 2-4.5L16 3l-2 2h-4z',
  gift: 'M4 11h16v10H4zM3 7h18v4H3zM12 7v14M12 7S10 3 8 3a2 2 0 0 0 0 4M12 7s2-4 4-4a2 2 0 0 1 0 4',
  landmark: 'M3 21h18M4 10h16M5 10v11M19 10v11M9 10v11M15 10v11M12 3 3 8h18z',
  ellipsis: 'M6 12h.01M12 12h.01M18 12h.01',
  banknote: 'M2 7h20v10H2zM12 12h.01M6 12h.01M18 12h.01',
  wallet: 'M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M3 8v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M3 8h15a3 3 0 0 1 3 3v2h-4a2.5 2.5 0 0 1 0-5h4M17.5 13h.01',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  chart: 'M3 21h18M7 17V9M12 17V5M17 17v-6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  plus: 'M12 5v14M5 12h14',
  check: 'm4 12 5 5L20 6',
  alert: 'M12 8v5M12 17h.01M12 3 2 20h20z',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.7L13.7 3.9a2 2 0 0 0-3.4 0z',
  siren: 'M7 12a5 5 0 0 1 10 0v5H7zM5 21h14M12 3v2M4.2 6.2l1.4 1.4M19.8 6.2l-1.4 1.4',
  ant: 'M12 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM12 8.4a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM12 14a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM10.8 3.6 9.4 2M13.2 3.6 14.6 2M9.6 9.4 6.4 7.8M14.4 9.4l3.2-1.6M9.6 11.6 6.4 13.2M14.4 11.6l3.2 1.6M9.4 16 6.6 17.6M14.6 16l2.8 1.6',
  repeat: 'M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  'arrow-up': 'M12 19V5M5 12l7-7 7 7',
  'arrow-down': 'M12 5v14M19 12l-7 7-7-7',
  'out': 'M7 17 17 7M9 7h8v8',
  'in': 'M17 7 7 17M15 17H7V9',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  shield: 'M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z',
  card: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M6 15h4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.3A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-3.2 4.1M6.2 6.8A18 18 0 0 0 2 12s3.6 7 10 7c1.3 0 2.5-.3 3.5-.7',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  x: 'M18 6 6 18M6 6l12 12',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.2-4.2',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  pencil: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3zM14 6l4 4',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  archive: 'M3 4h18v4H3zM5 8v13h14V8M10 12h4',
  'chevron-left': 'm15 5-7 7 7 7',
  'chevron-right': 'm9 5 7 7-7 7',
  'chevron-down': 'm5 9 7 7 7-7',
  scale: 'M12 3v18M7 21h10M6 7h12M6 7 3 14h6zM18 7l-3 7h6z',
  inbox: 'M3 13h5l1.5 3h5L16 13h5M3 13 6 5h12l3 8v6H3z',
  piggy: 'M3 12a6 6 0 0 1 6-6h4.5a5.5 5.5 0 0 1 5.3 4H21v4h-2.2a5.6 5.6 0 0 1-1.8 2.2V19h-3v-1.2h-3V19H8v-2.1A6 6 0 0 1 3 12zM6 10.5h.01M13.5 6V4'
};

interface Props {
  name: IconName | string | null | undefined;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, className, strokeWidth = 1.8 }: Props) {
  const d = PATHS[(name ?? 'ellipsis') as IconName] ?? PATHS.ellipsis;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
