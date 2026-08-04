export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

export const formatTime = (date: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(date));

export const formatDateTime = (date: string) => `${formatDate(date)}, ${formatTime(date)}`;

export const formatDuration = (minutes: number) => `${minutes} mins`;

export const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const truncate = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}...` : text;
