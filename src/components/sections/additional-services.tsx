"use client";

export default function AdditionalServices() {
  return (
    <div className="bg-white rounded-lg border border-[#DDDDDD] shadow-sm px-2 pt-2 pb-2 h-full flex flex-col">
      <h3 className="text-[18px] font-semibold text-[#333333] mb-2 flex-shrink-0">Дополнительные сервисы</h3>
      <div className="space-y-1 flex-1">
        <a 
          href="https://cpcd.consultant.ru/production/?selectTab=policies" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Конструктор учётной политики
        </a>
        <a 
          href="https://spspsmart.consultant.ru/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Спец.поиск судебной практики
        </a>
        <a 
          href="https://calc.consultant.ru/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Калькуляторы
        </a>
        <a 
          href="https://consultant-plus-kursk.ru/vebinary" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Вебинары
        </a>
      </div>
    </div>
  );
}