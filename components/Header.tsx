import Image from 'next/image';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full px-8 py-5 z-[100] bg-transparent">
      <Image 
        src="/icons-system/Main logo.png" 
        alt="MyLauncher Logo" 
        width={150} 
        height={40}
        className="drop-shadow-[2px_2px_4px_rgba(0,0,0,0.5)]"
      />
    </header>
  );
}