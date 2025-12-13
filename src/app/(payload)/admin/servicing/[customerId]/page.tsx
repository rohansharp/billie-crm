import type { Metadata } from 'next'
import { ServicingView } from '@/components/ServicingView'

type Props = {
  params: Promise<{ customerId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { customerId } = await params
  return {
    title: `Customer ${customerId} | Servicing`,
  }
}

export default async function ServicingPage({ params }: Props) {
  const { customerId } = await params
  
  return <ServicingView customerId={customerId} />
}
