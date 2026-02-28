import AppSidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F6F9FC] dark:bg-[#0A0A0A] transition-colors duration-300">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="min-h-full px-8 py-7">{children}</div>
      </main>
    </div>
  );
}
