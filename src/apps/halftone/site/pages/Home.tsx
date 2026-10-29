import { ArrowRight } from 'lucide-react'
import { Capabilities } from '../components/sections/Capabilities'
import { ClientMarquee } from '../components/sections/ClientMarquee'
import { CTA } from '../components/sections/CTA'
import { FAQ } from '../components/sections/FAQ'
import { Hero } from '../components/sections/Hero'
import { Process } from '../components/sections/Process'
import { SelectedWork } from '../components/sections/SelectedWork'
import { Stats } from '../components/sections/Stats'
import { Testimonials } from '../components/sections/Testimonials'
import { PricingCalculator } from '../components/pricing/PricingCalculator'
import { ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { Accent, SectionHeader } from '../components/ui/SectionHeader'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Home() {
  useDocumentTitle()
  return (
    <>
      <Hero />
      <ClientMarquee />
      <SelectedWork />
      <Capabilities />
      <Process />
      <Stats />
      <section className="border-t border-white/[0.05] py-16 md:py-24 lg:py-32">
        <div className="container-x">
          <SectionHeader
            eyebrow="Pricing"
            title={<>An honest number in <Accent>thirty seconds.</Accent></>}
            lead="No “let’s hop on a call to discuss budget.” Configure an engagement and see what it costs."
            action={
              <ButtonLink to="/pricing" variant="secondary">
                Compare plans <ArrowRight className="size-4" />
              </ButtonLink>
            }
          />
          <Reveal>
            <PricingCalculator />
          </Reveal>
        </div>
      </section>
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  )
}
