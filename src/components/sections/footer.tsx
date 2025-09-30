"use client";

export default function Footer() {
  return (
    <footer className="bg-white py-4 mt-auto">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center space-y-2">
          <p className="text-xs text-[#333333]">©1998 - 2025 гг. ООО Инфо-Комплекс Плюс</p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#666666]">
            <a href="https://www.consultant.ru/about/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066CC] transition-colors"></a>
            <a href="https://www.consultant.ru/legalnews/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066CC] transition-colors"></a>
            <a href="https://www.consultant.ru/edu/student/contacts/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066CC] transition-colors"></a>
            <a href="https://www.consultant.ru/about/software/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066CC] transition-colors"></a>
          </div>
        </div>
      </div>
    </footer>
  );
}