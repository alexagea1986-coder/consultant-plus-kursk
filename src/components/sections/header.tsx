import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
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
  { value: 'universal_budget', label: 'Универсальный для бюджетной организации' }];


  const selectedLabel = useMemo(() => {
    const profile = profiles.find((p) => p.value === selectedProfile);
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
  { label: "Контакты", href: "/contacts" }];

  return (
    <header className="bg-white shadow-sm px-5 py-2">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-start md:items-center flex-wrap gap-2 md:gap-0">
        {/* Logo and profile - left aligned */}
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0 order-1 w-full md:w-auto">
          <Image
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/8548ce4b-c4e7-49fc-aeb1-0d89445da897-consultant-ru/assets/images/logoCircle-2.svg"
            alt="КонсультантПлюс"
            width={40}
            height={40}
            className="mr-0 flex-shrink-0"
          />

          <div className="flex items-center space-x-1 md:space-x-2 flex-wrap min-w-0">
            <span className="text-base md:text-xl font-bold text-[#0066CC] truncate">НейроКонсультантПлюс</span>
            <span className="text-[12px] font-bold text-[#0066CC]">Профиль:</span>
            <Select value={selectedProfile} onValueChange={onProfileChange}>
              <SelectTrigger
                className="text-[12px] text-[#666666] bg-white h-6 w-[180px] md:w-auto inline-flex items-center justify-between px-2 border border-gray-300"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-[12px]">
                {profiles.map((profile) =>
                <SelectItem key={profile.value} value={profile.value} className="text-[12px] flex items-center">
                    <span className="flex-1">{profile.label}</span>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Navigation - centered below on mobile, inline on desktop */}
        <nav className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 flex-shrink-0 order-2 w-full md:w-auto justify-center mt-2 md:mt-0">
          <a
            href="https://consultant-plus-kursk.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
          >
            Новости
          </a>
          <a
            href="https://consultant-plus-kursk.ru/o-kompanii"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
          >
            Продукты
          </a>
          <a
            href="https://consultant-plus-kursk.ru/o-kompanii-2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
          >
            О компании
          </a>
          <a
            href="https://consultant-plus-kursk.ru/kontakty"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-medium text-[#0066CC] hover:text-[#FFD700] transition-colors duration-200 no-underline"
          >
            Контакты
          </a>
        </nav>

        {/* Contact Info - right aligned on desktop, below on mobile */}
        <div className="flex items-center text-sm text-[#666666] flex-shrink-0 order-3 md:order-last w-full md:w-auto justify-center md:justify-end mt-2 md:mt-0 md:ml-auto">
          <a href="tel:+74712526969" className="hover:text-[#0066CC]">тел. (4712) 52-69-69</a>
        </div>
      </div>
    </header>
  );
}