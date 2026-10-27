/**
 * Age in whole years and months, e.g. "2y 5m".
 *
 * Birth dates arrive as ISO strings (sometimes with a time component), so only
 * the date part is used to avoid timezone shifts moving the birthday by a day.
 */
export function formatAge(
  birthDate: string | null | undefined,
  now: Date = new Date()
): string {
  if (!birthDate) return "—";

  const datePart = birthDate.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) return "—";

  const birth = new Date(year, month - 1, day);
  if (Number.isNaN(birth.getTime()) || birth > now) return "—";

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  months = Math.max(months, 0);

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths}m`;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}m`;
}
