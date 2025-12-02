import { useState } from "react";
import { NavLink } from "react-router-dom";

// type 선언
type SubMenu = {
  id: number;
  label: string;
  to: string;
};

type Menu = {
  id: number;
  label: string;
  children: SubMenu[];
};

// 2. 메뉴 데이터
const menuData: Menu[] = [
  {
    id: 1,
    label: "이용안내",
    children: [
      { id: 11, label: "주요시설", to: "/guide/facility" },
      { id: 12, label: "오시는 길/주차정보", to: "/guide/location" },
      { id: 13, label: "신청방법", to: "/guide/apply" },
      { id: 14, label: "운영시간", to: "/guide/time" },
      { id: 15, label: "자주 묻는 질문", to: "/guide/faq" },
    ],
  },
  {
    id: 2,
    label: "상품/시설안내",
    children: [
      { id: 21, label: "헬스", to: "/products/health" },
      { id: 22, label: "수영", to: "/products/swimming" },
    ],
  },
  {
    id: 3,
    label: "시설예약",
    children: [
      { id: 31, label: "예약 신청", to: "/reserve/apply" },
      { id: 32, label: "결제 신청", to: "/reserve/pay" },
    ],
  },
];

export function UserNav() {
  // activeMenu는 null 또는 number
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  return (
    <div>
      {/* 1뎁스 메뉴 (가로 배치) */}
      <nav>
        {menuData.map((menu) => (
          <button
            key={menu.id}
            onClick={() => setActiveMenu(menu.id)}
            className={`px-4 py-2 ${
              activeMenu === menu.id ? "font-bold border-b-2 border-blue-500" : ""
            }`}
          >
            {menu.label}
          </button>
        ))}
      </nav>

      {/* 2뎁스 메뉴 (세로 배치, 왼쪽에 표시) */}
      {activeMenu && (
        <aside>
          <ul>
            {menuData
              .find((m) => m.id === activeMenu)
              ?.children.map((submenu) => (
                <li key={submenu.id}>
                  <NavLink
                    to={submenu.to}
                    className={({ isActive }) =>
                      isActive ? "text-blue-600 font-semibold" : "text-gray-700"
                    }
                  >
                    {submenu.label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
