import { getInitials } from "@/utils/formatters";
export function Avatar({ name }: { name: string }) {
  return <div className="grid h-10 w-10 place-items-center rounded-full bg-primary-600 text-sm font-semibold text-white">{getInitials(name)}</div>;
}
