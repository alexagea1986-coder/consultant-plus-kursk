import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

interface HeaderProps {
  anonymousLoggedIn: boolean;
  onAnonymousLogin: () => void;
}

export default function Header({ anonymousLoggedIn, onAnonymousLogin }: HeaderProps) {
  const navItems = [
    { label: "Новости", href: "/news" },
    { label: "Продукты", href: "/products" },
    { label: "О компании", href: "/about" },
    { label: "Контакты", href: "/contacts" }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/8548ce4b-c4e7-49fc-aeb1-0d89445da897-consultant-ru/assets/images/logoCircle-2.svg"
            alt="КонсультантПлюс"
            width={40}
            height={40}
            className="mr-3" />

          <span className="text-xl font-bold text-[#333333] whitespace-pre-line">Инфо-Комплекс Плюс</span>
        </div>

        {/* Navigation and Contact */}
        <div className="flex items-center space-x-4">
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto">
            <a
              href="https://consultant-plus-kursk.ru/"
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Новости
            </a>
            <a 
              href="https://consultant-plus-kursk.ru/o-kompanii" 
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Продукты
            </a>
            <a 
              href="https://consultant-plus-kursk.ru/o-kompanii-2" 
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              О компании
            </a>
            <a 
              href="https://consultant-plus-kursk.ru/kontakty" 
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Контакты
            </a>
          </nav>

          {/* Contact Info */}
          <div className="hidden md:block text-right text-sm text-[#666666] ml-8">
            <div className="space-y-1">
              <a href="tel:+74712526969" className="block hover:text-[#0066CC]">тел. (4712) 52-69-69</a>
              <a href="tel:+78002000527" className="block hover:text-[#0066CC]">тел. 8-800-200-05-27</a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}