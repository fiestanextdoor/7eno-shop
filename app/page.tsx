import Logo from '@/components/Logo/Logo'

export default function Page() {
  return (
    <main style={{ padding: 40, background: '#111', minHeight: '100vh' }}>
      <Logo fg="#F6F3EC" height={48} showKeraunos />
    </main>
  )
}
