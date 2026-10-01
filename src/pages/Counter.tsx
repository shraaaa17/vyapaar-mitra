import { useTranslation } from 'react-i18next'
<<<<<<< HEAD
import { BillCard, SoundboxCard } from '../components/counter'
import { MerchantPayment } from '../components/illustrations'
import { PageHeader } from '../components/layout/PageHeader'

/**
 * The merchant's home screen at the till: billing and Soundbox, side by side
 * on wider screens and stacked on phones.
=======
import {
  ActivityCard,
  ApprovalsCard,
  AskCard,
  BillCard,
  DipInsightCard,
  MoreSections,
  SoundboxCard,
  TodayCard,
} from '../components/counter'
import { PageHeader } from '../components/layout/PageHeader'

/**
 * The merchant's home screen at the till. Today's sales and the dip insight
 * on top; billing, Ask and links to every other section on the left; the
 * Soundbox, approvals and agent activity on the right. One column on phones.
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
 */
export function Counter() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('counter.title')} visuallyHidden />
<<<<<<< HEAD
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(10rem,0.55fr)]">
        <MerchantPayment
          className="order-last ml-auto h-[180px] w-[86px] md:h-[260px] md:w-[124px] xl:order-first xl:col-span-1 xl:row-span-2 xl:mt-4 xl:h-[460px] xl:w-[219px]"
        />
        <BillCard />
        <SoundboxCard />
      </div>
=======
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
        <TodayCard />
        <DipInsightCard />
      </div>
      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:mt-6 lg:grid-cols-2 lg:gap-6">
        <div className="flex flex-col gap-5 lg:gap-6">
          <BillCard />
          <AskCard />
          {/* On wide screens the section links fill the shorter left column; phones get them at the end. */}
          <MoreSections className="hidden lg:block" stacked />
        </div>
        <div className="flex flex-col gap-5 lg:gap-6">
          <SoundboxCard />
          <ApprovalsCard />
          <ActivityCard />
        </div>
      </div>
      <MoreSections className="mt-8 lg:hidden" />
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
    </>
  )
}
