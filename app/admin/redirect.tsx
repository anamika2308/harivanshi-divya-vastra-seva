import { redirect } from 'next/navigation'

// /admin pe seedha aane walo ko 404 dikhao
export default function AdminPage() {
  redirect('/404')
}