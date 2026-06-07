import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Nav from '@/components/Nav/Nav'
import { getBundleBySlug, getBundles, computeBundlePricing, lowestVariantPriceCents } from '@/lib/bundles'
import { getCatalogProduct } from '@/lib/catalog'
import BundleConfigurator, { type BundleProductData } from './BundleConfigurator'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getBundles().map((b) => ({ slug: b.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const bundle = getBundleBySlug(slug)
  return { title: bundle ? `${bundle.title} — 7ENO` : '7ENO' }
}

export default async function DealPage({ params }: Props) {
  const { slug } = await params
  const bundle = getBundleBySlug(slug)
  if (!bundle) notFound()

  let products: BundleProductData[]
  try {
    products = await Promise.all(
      bundle.products.map(async (ref) => {
        const detail = await getCatalogProduct(ref.provider, ref.productId)
        return {
          provider: ref.provider,
          productId: ref.productId,
          name: detail.name,
          thumbnailUrl: detail.thumbnailUrl,
          variants: detail.variants,
        }
      }),
    )
  } catch {
    notFound()
  }

  const sumCents = products!.reduce((sum, p) => sum + lowestVariantPriceCents(p.variants), 0)
  const pricing = computeBundlePricing(Number.isFinite(sumCents) ? sumCents : 0, bundle.discountCents)

  return (
    <>
      <Nav />
      <BundleConfigurator
        bundleId={bundle.id}
        bundleTitle={bundle.title}
        description={bundle.description ?? null}
        products={products!}
        discountCents={pricing.discountCents}
      />
    </>
  )
}
