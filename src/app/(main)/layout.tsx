import StompProvider from '@/components/StompProvider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <StompProvider>
      <header>상단바</header>
      <main>{children}</main>
    </StompProvider>
  );
}
