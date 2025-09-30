"use client";

export default function Footer() {
  return (
    <footer className="bg-purple-50 border-t border-yellow-200 py-4 mt-auto">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="text-center space-y-2">
          <p className="text-base text-purple-800 font-semibold">©1998 г.- 2025 г.  ООО Инфо-Комплекс Плюс</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-purple-600">
            <a href="https://www.consultant.ru/about/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-700 transition-colors !whitespace-pre-line"></a>
            <a href="https://www.consultant.ru/legalnews/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-700 transition-colors !whitespace-pre-line"></a>
            <a href="https://www.consultant.ru/edu/student/contacts/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-700 transition-colors"></a>
            <a href="https://www.consultant.ru/about/software/" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-700 transition-colors !whitespace-pre-line"></a>
          </div>
        </div>
      </div>
    </footer>
  );
}