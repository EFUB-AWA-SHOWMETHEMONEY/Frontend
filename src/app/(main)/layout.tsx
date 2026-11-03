import ShopHeader from '@/components/shop/ShopHeader';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ShopHeader nickname="쇼미더MONEY" />
      <main>{children}</main>
    </>
  );
}
