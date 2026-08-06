import { PageHeader } from "@/components/ui";
import { useMenuItems } from "../hooks/useMenuAdmin";

export default function MenuItemsPage() {
  const { data } = useMenuItems();
  return (
    <div className="space-y-6">
      <PageHeader title="Menu Items" subtitle="Manage items, variants and addons" />
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Veg</th>
              <th>Prep Time</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((item) => (
              <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-3">{item.name}</td>
                <td>{item.category?.name ?? "-"}</td>
                <td>₹{item.price}</td>
                <td>{item.isVeg ? "Veg" : "Non-Veg"}</td>
                <td>{item.prepTime ?? 0} mins</td>
                <td>{item.isAvailable ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

