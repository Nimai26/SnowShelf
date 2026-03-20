import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden sm:block border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-auto">
      <div className="container mx-auto px-4 py-4">
        <p className="flex items-center justify-center gap-1 text-center text-xs text-[var(--color-text-secondary)]">
          © {currentYear} SnowShelf — Made with <Heart className="h-3 w-3 fill-red-500 text-red-500" /> by Nimai
        </p>
      </div>
    </footer>
  );
}
