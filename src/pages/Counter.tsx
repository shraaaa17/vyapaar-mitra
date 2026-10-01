import { useTranslation } from 'react-i18next'
import { BillCard, SoundboxCard } from '../components/counter'
import { MerchantPayment } from '../components/illustrations'
import { PageHeader } from '../components/layout/PageHeader'

/**
 * The merchant's home screen at the till: billing and Soundbox, side by side
 * on wider screens and stacked on phones.
 */
export function Counter() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('counter.title')} visuallyHidden />
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(10rem,0.55fr)]">
        <MerchantPayment
          className="order-last ml-auto h-[180px] w-[86px] md:h-[260px] md:w-[124px] xl:order-first xl:col-span-1 xl:row-span-2 xl:mt-4 xl:h-[460px] xl:w-[219px]"
        />
        <BillCard />
        <SoundboxCard />
      </div>
    </>
  )
}
