import BottomNav from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[720px] px-4 pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
