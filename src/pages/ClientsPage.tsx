import { useState } from 'react'
import { CardListWithPhoto } from '../components/common/CardListWithPhoto'
import { EntityFormModal } from '../components/common/EntityFormModal'
import { FormField } from '../components/common/FormField'
import { PhotoUploader } from '../components/common/PhotoUploader'
import { useClients, useDeleteClient, useUpsertClient } from '../hooks/useClients'
import type { Client } from '../types/db'

const EMPTY: Partial<Client> = { name: '', company: '', phone: '', logo_url: null, notes: '' }

export function ClientsPage() {
  const { data: clients = [], isLoading } = useClients()
  const upsert = useUpsertClient()
  const del = useDeleteClient()
  const [editing, setEditing] = useState<Partial<Client> | null>(null)

  function openEdit(id: string) {
    setEditing(clients.find((c) => c.id === id) ?? EMPTY)
  }

  async function handleSave() {
    if (!editing?.name) return
    await upsert.mutateAsync(editing)
    setEditing(null)
  }

  async function handleDelete() {
    if (!editing?.id) return
    if (!confirm('Удалить клиента?')) return
    await del.mutateAsync(editing.id)
    setEditing(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-ink mb-6">Клиенты</h1>

      {isLoading ? (
        <div className="text-brand-gray-dark">Загрузка…</div>
      ) : (
        <CardListWithPhoto
          items={clients.map((c) => ({
            id: c.id,
            photo_url: c.logo_url,
            title: c.name,
            subtitle: c.company,
            meta: c.phone,
          }))}
          onItemClick={openEdit}
          onAdd={() => setEditing(EMPTY)}
          emptyLabel="Клиентов пока нет"
          addLabel="Клиент"
        />
      )}

      <EntityFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Редактировать клиента' : 'Новый клиент'}
        onDelete={editing?.id ? handleDelete : undefined}
        photoSlot={
          <PhotoUploader
            value={editing?.logo_url ?? null}
            folder="clients"
            onChange={(path) => setEditing((prev) => (prev ? { ...prev, logo_url: path } : prev))}
          />
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-brand-gray-dark hover:bg-brand-gray transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={upsert.isPending || !editing?.name}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-yellow text-brand-black disabled:opacity-50 hover:brightness-95 transition"
            >
              Сохранить
            </button>
          </>
        }
      >
        {editing && (
          <>
            <FormField
              label="Имя"
              value={editing.name ?? ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <FormField
              label="Компания"
              value={editing.company ?? ''}
              onChange={(e) => setEditing({ ...editing, company: e.target.value })}
            />
            <FormField
              label="Телефон"
              value={editing.phone ?? ''}
              onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
            />
            <FormField
              label="Заметки"
              value={editing.notes ?? ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
          </>
        )}
      </EntityFormModal>
    </div>
  )
}
