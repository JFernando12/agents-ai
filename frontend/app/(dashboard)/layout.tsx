import Header from '@/components/layout/Header';
import DashboardNav from '@/components/layout/DashboardNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-[#F7F8FA]">
      <Header />
      <DashboardNav />
      <main className="flex-1 flex flex-col px-8 py-4 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
