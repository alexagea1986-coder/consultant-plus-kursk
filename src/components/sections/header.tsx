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
  selectedProfile: string;
  onProfileChange: (profile: string) => void;
}

export default function Header({ anonymousLoggedIn, onAnonymousLogin, selectedProfile, onProfileChange }: HeaderProps) {
  const profiles = [
    { value: 'universal', label: 'Универсальный' },
    { value: 'accounting_hr', label: 'Бухгалтерия и кадры' },
    { value: 'lawyer', label: 'Юрист' },
    { value: 'budget_accounting', label: 'Бухгалтерия и кадры бюджетной организации' },
    { value: 'procurements', label: 'Специалист по закупкам' },
    { value: 'hr', label: 'Кадры' },
    { value: 'labor_safety', label: 'Специалист по охране труда' },
    { value: 'nta', label: 'Специалист по нормативно-техническим актам' },
    { value: 'universal_budget', label: 'Универсальный для бюджетной организации' }
  ];

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

          <div>
            <span className="text-xl font-bold text-[#333333] whitespace-pre-line block">Инфо-Комплекс Плюс</span>
            <div className="flex items-center mt-1">
              <span className="text-[12px] font-bold text-[#333333] mr-2">Профиль</span>
              <select 
                value={selectedProfile} 
                onChange={(e) => onProfileChange(e.target.value)}
                className="text-[12px] text-[#666666] border border-[#DDDDDD] rounded px-2 py-1 bg-white"
              >
                {profiles.map((profile) => (
                  <option key={profile.value} value={profile.value}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
          <div className="hidden md:flex items-center text-sm text-[#666666] ml-8">
            <a href="tel:+74712526969" className="hover:text-[#0066CC]">тел. (4712) 52-69-69</a>
          </div>
        </div>
      </div>
    </header>
  );
}