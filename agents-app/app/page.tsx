import Header from "@/components/Header";
import TabsLayout from "@/components/TabsLayout";

export default async function Home() {
  return (
    <div className="h-screen flex flex-col bg-[#F7F8FA]">
      <Header />

      <main className="flex-1 flex flex-col px-8 py-2 overflow-hidden">
        <TabsLayout />
      </main>
    </div>
  );
}
