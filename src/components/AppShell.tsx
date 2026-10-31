import { NavLink, Outlet } from 'react-router-dom'
import { BookIcon, BoxIcon, SlidersIcon } from './icons'

const items = [
  { to: '/', label: '내 도안', end: true, Icon: BookIcon },
  { to: '/inventory', label: '재고', end: false, Icon: BoxIcon },
  { to: '/settings', label: '설정', end: false, Icon: SlidersIcon },
]

/** 폰에서는 아래쪽 탭, 아이패드·PC에서는 왼쪽 사이드바가 되는 공통 틀 */
export default function AppShell() {
  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <nav
        aria-label="주요 메뉴"
        className="flex border-t border-line bg-white px-2 pt-1.5 pb-[max(1rem,env(safe-area-inset-bottom))] md:order-first md:w-60 md:flex-none md:flex-col md:gap-1 md:border-t-0 md:border-r md:px-3.5 md:py-7"
      >
        <div className="hidden px-3 pb-5 text-lg font-bold text-primary md:block">뜨개 기록</div>
        {items.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex min-h-[52px] flex-1 flex-col items-center justify-center gap-[3px] text-xs',
                'md:min-h-[46px] md:flex-none md:flex-row md:justify-start md:gap-3 md:rounded-[10px] md:px-3 md:text-[15px]',
                isActive
                  ? 'font-bold text-primary md:bg-primary-soft'
                  : 'font-medium text-muted md:text-ink',
              ].join(' ')
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
