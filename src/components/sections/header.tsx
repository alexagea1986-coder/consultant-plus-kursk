import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { useMemo } from "react";

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

  const selectedLabel = useMemo(() => {
    const profile = profiles.find(p => p.value === selectedProfile);
    return profile ? profile.label : 'Универсальный';
  }, [selectedProfile]);

  const dynamicWidth = useMemo(() => {
    const baseWidth = 120;
    const charWidth = 8;
    const maxWidth = 300;
    const minWidth = 150;
    const calculated = baseWidth + selectedLabel.length * charWidth;
    return Math.max(minWidth, Math.min(maxWidth, calculated));
  }, [selectedLabel]);

  const navItems = [
    { label: "Новости", href: "/news" },
    { label: "Продукты", href: "/products" },
    { label: "О компании", href: "/about" },
    { label: "Контакты", href: "/contacts" }
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm px-4 py-2">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Navigation and Contact */}
        <div className="flex items-center space-x-4">
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8 ml-auto">
            <a
              href="https://consultant-plus-kursk.ru/"
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer">
              Новости
            </a>
            <a
              href="https://consultant-plus-kursk.ru/o-kompanii"
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer">
              Продукты
            </a>
            <a
              href="https://consultant-plus-kursk.ru/o-kompanii-2"
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer">
              О компании
            </a>
            <a
              href="https://consultant-plus-kursk.ru/kontakty"
              className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
              target="_blank"
              rel="noopener noreferrer">
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