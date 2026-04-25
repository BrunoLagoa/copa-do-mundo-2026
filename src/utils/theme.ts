/**
 * Theme class constants — use these in all components.
 * Every token has both light and dark variants.
 * Adding a new component? Import from here instead of writing raw Tailwind classes.
 */

/** Page / layout backgrounds */
export const bg = {
  page:    'bg-gray-50 dark:bg-gray-900',
  card:    'bg-white dark:bg-gray-800',
  nav:     'bg-white dark:bg-gray-900',
  subtle:  'bg-gray-50 dark:bg-gray-700',   // thead, secondary surfaces
  hover:   'hover:bg-gray-50 dark:hover:bg-gray-700',
} as const;

/** Borders */
export const border = {
  default: 'border-gray-200 dark:border-gray-700',
  subtle:  'border-gray-100 dark:border-gray-700',
  divider: 'divide-gray-100 dark:divide-gray-700',
} as const;

/** Text */
export const text = {
  primary:   'text-gray-900 dark:text-gray-100',
  secondary: 'text-gray-500 dark:text-gray-400',
  muted:     'text-gray-400 dark:text-gray-500',
  heading:   'text-gray-800 dark:text-gray-200',
  tableHead: 'text-gray-600 dark:text-gray-300',
  link:      'text-green-600 dark:text-green-400',
} as const;

/**
 * Compound helpers for common UI patterns.
 * Usage: <div className={cx(theme.card, 'rounded-xl p-4')}>
 */
export const cx = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(' ');

export const theme = {
  card:      `${bg.card} ${border.default}`,
  tableWrap: `${bg.card} ${border.default} overflow-x-auto rounded-lg`,
  thead:     `${bg.subtle} ${text.tableHead} text-xs uppercase tracking-wide`,
  tbody:     `${border.divider}`,
  tr:        `${bg.hover} transition-colors`,
} as const;
