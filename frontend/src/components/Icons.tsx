/** Line icons from the flow prototype (16 px grid, 1.8 stroke). Always decorative: the word next to it carries the meaning. */
const PATHS = {
  check: <path d="M3 8.5l3.2 3L13 4.5" />,
  clock: <><circle cx="8" cy="8" r="6" /><path d="M8 4.8V8l2.2 1.6" /></>,
  x: <path d="M4 4l8 8M12 4l-8 8" />,
  chev: <path d="M4 6l4 4 4-4" />,
  back: <path d="M10 3.5L5.5 8l4.5 4.5" />,
  ext: <path d="M6 3.5H3.5v9h9V10M9 3h4v4M13 3L7.5 8.5" />,
  alert: <><path d="M8 2.2l6.3 11H1.7z" /><path d="M8 6.5v3M8 11.6v.1" /></>,
  info: <><circle cx="8" cy="8" r="6" /><path d="M8 7.2v4M8 4.9v.1" /></>,
  filter: <path d="M2.5 4h11M4.5 8h7M6.5 12h3" />,
  ok: <><circle cx="8" cy="8" r="6" /><path d="M5.3 8.2l1.8 1.8 3.6-3.8" /></>,
  search: <><circle cx="7" cy="7" r="4.6" /><path d="M10.4 10.4L14 14" /></>,
  pause: <path d="M5.5 3.5v9M10.5 3.5v9" />,
  play: <path d="M5 3.5l7 4.5-7 4.5z" />,
  flask: <path d="M6 2h4M7 2v4.5L3.2 13a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L9 6.5V2M5 10.5h6" />,
  school: <path d="M2 6.5L8 3l6 3.5Z M4.5 8v4M8 8v4M11.5 8v4M2.5 13.5h11" />,
  doc: <path d="M4 2h5.5L12.5 5v9h-8.5Z M6.5 8h4M6.5 11h4" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name }: { name: IconName }) {
  return <svg className="i" viewBox="0 0 16 16" aria-hidden="true" focusable="false">{PATHS[name]}</svg>;
}

export const AREA_ICON: Record<string, IconName> = { technological: "flask", educational: "school", administrative: "doc" };
