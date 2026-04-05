export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center py-12">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
