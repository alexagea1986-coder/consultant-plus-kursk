"use client";

export default function AdditionalServices() {
  return (
    <div className="bg-white rounded-lg border border-[#DDDDDD] shadow-sm px-6 pt-2 pb-2">
      <h3 className="text-[18px] font-semibold text-[#333333] mb-2">Дополнительные сервисы</h3>
      <div className="space-y-1">
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
          href="https://aoas.consultant.ru/cgi/online.cgi?req=card" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Архив определений арбитражных судов
        </a>
        <a 
          href="https://arms.consultant.ru/cgi/online.cgi?req=card" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Архив решений мировых судей
        </a>
        <a 
          href="https://afas.consultant.ru/cgi/online.cgi?req=card" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Архив решений ФАС и УФАС
        </a>
        <a 
          href="https://admo.consultant.ru/cgi/online.cgi?req=card" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-2 text-[#0066CC] hover:bg-[#F5F5F5] rounded transition-colors text-[14px]"
        >
          Архив документов муниципальных образований РФ
        </a>
      </div>
    </div>
  );
}