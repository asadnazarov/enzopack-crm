import { publicMediaUrl } from '../../lib/supabaseClient'

export interface CardListItem {
  id: string
  photo_url?: string | null
  title: string
  subtitle?: string | null
  badge?: string | null
  meta?: string | null
}

interface CardListWithPhotoProps {
  items: CardListItem[]
  onItemClick: (id: string) => void
  onAdd: () => void
  emptyLabel?: string
  addLabel?: string
}

export function CardListWithPhoto({
  items,
  onItemClick,
  onAdd,
  emptyLabel = 'Пока пусто',
  addLabel = 'Добавить',
}: CardListWithPhotoProps) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 bg-brand-yellow text-brand-black font-semibold px-4 py-2 rounded-full shadow-sm hover:brightness-95 active:scale-95 transition"
        >
          <span className="text-lg leading-none">+</span> {addLabel}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-brand-gray-dark py-16">{emptyLabel}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const photo = publicMediaUrl(item.photo_url)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemClick(item.id)}
                className="text-left bg-white border border-brand-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="h-32 bg-brand-gray flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <img src={photo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-brand-gray-dark text-xs">Нет фото</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-brand-ink truncate">{item.title}</div>
                    {item.badge && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-yellow-light text-brand-yellow-dark whitespace-nowrap">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <div className="text-sm text-brand-gray-dark truncate">{item.subtitle}</div>
                  )}
                  {item.meta && <div className="text-xs text-brand-gray-dark mt-1">{item.meta}</div>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
