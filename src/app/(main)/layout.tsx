import StompProvider from '@/components/StompProvider';
import ShopHeader from '@/components/shop/ShopHeader';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <StompProvider>
      <ShopHeader nickname="쇼미더MONEY" />
      <main>{children}</main>
    </StompProvider>
  );
}
