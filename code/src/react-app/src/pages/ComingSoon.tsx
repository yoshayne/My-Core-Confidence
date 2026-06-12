import BottomNav from "../components/BottomNav";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-text-secondary">Coming soon.</p>
      </div>
      <BottomNav />
    </div>
  );
}
