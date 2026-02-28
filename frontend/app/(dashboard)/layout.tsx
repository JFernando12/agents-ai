import AppSidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-white dark:bg-[#111111] transition-colors duration-300">
      <AppSidebar />
      <main className="flex-1 min-w-0 min-h-0 overflow-hidden bg-[#F4F6F8] dark:bg-[#0D0D0D]">
        <div className="h-full overflow-y-auto overflow-x-hidden p-5">
          {children}
        </div>
      </main>
    </div>
  );
}
