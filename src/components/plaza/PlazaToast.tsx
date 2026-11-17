export default function PlazaToast({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="pointer-events-none fixed top-[179px] left-1/2 z-20 -translate-x-1/2 overflow-hidden rounded-full border-[3px] border-brown-dark bg-brown-dark px-9 py-3 font-jua text-2xl tracking-[-0.24px] whitespace-nowrap text-ivory shadow-[0_5px_20px_rgb(0_0_0/10%)] max-md:max-w-[calc(100vw-32px)] max-md:text-lg max-md:whitespace-normal"
    >
      {message}
    </p>
  );
}
