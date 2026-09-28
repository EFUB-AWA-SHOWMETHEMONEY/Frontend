export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>상단바</header>
      <main>{children}</main>
    </>
  );
}
