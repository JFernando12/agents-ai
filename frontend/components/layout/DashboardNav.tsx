"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/agents", label: "Centro de Agentes" },
  { href: "/unanswered", label: "Sin Respuesta" },
  { href: "/tools", label: "Herramientas" },
  { href: "/changelog", label: "Log de Cambios" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white px-8 flex-shrink-0">
      <div className="flex space-x-8">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`py-3 text-lg font-medium transition-colors border-b-2 ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
