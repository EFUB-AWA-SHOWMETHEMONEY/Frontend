import MainShell from '@/components/layout/MainShell';
import StompProvider from '@/components/StompProvider';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <StompProvider>
      <MainShell>{children}</MainShell>
    </StompProvider>
  );
}
