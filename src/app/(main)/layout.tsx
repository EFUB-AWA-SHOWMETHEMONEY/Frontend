import Header from '@/components/layout/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header nickname="쇼미더MONEY" balance={1000} />
      <main>{children}</main>
    </>
  );
}
