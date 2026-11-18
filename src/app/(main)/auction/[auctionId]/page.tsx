import AuctionDetailContainer from '@/components/auction/AuctionDetailContainer';

export default async function AuctionDetailPage({
  params,
}: {
  params: Promise<{ auctionId: string }>;
}) {
  const { auctionId } = await params;
  return <AuctionDetailContainer key={auctionId} auctionId={auctionId} />;
}
