import { getUsers } from "./actions"
import { UserTable } from "./user-table"

export default async function AdminUsersPage() {
  const { data: users, error } = await getUsers()

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-600 mt-1">Kelola data karyawan, akses, dan peran di dalam sistem HRIS.</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          Gagal memuat data pengguna: {error}
        </div>
      ) : (
        <UserTable users={users || []} />
      )}
    </div>
  )
}
