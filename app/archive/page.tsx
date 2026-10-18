import type { Metadata } from 'next'
import EditionCard from '@/components/ui/EditionCard/EditionCard'
import { currentTimeMs, isDropListed, listDropsNewestFirst, toDropView } from '@/lib/drops'
import { isPreviewSession } from '@/lib/preview-session'
import { absoluteUrl } from '@/lib/seo'
import styles from './archive.module.css'

const DESCRIPTION =
  'Every 7ENO (Zeno) edition, newest first: release window, status and the pieces of each drop.'

export const metadata: Metadata = {
  title: 'Archive',
  description: DESCRIPTION,
  alternates: { canonical: '/archive' },
  openGraph: { title: 'Archive · 7ENO (Zeno)', description: DESCRIPTION, url: absoluteUrl('/archive'), type: 'website' },
}

// Status labels follow the drop clock.
export const revalidate = 60

export default async function ArchivePage() {
  const now = currentTimeMs()
  const preview = await isPreviewSession()
  // Closed editions stay listed; only an upcoming drop without a teaser is hidden.
  const editions = listDropsNewestFirst()
    .filter((d) => isDropListed(d, now, { preview }))
    .map((d) => toDropView(d, now, { preview }))

  return (
    <main className={styles.page}>
      <header className={styles.header} data-reveal="hero">
        <p className={styles.label}>Archive</p>
        <h1 className={styles.title}>Every edition</h1>
      </header>
      <ol className={styles.list} data-reveal="stagger">
        {editions.map((drop) => (
          <li key={drop.id}>
            <EditionCard drop={drop} />
          </li>
        ))}
      </ol>
    </main>
  )
}
