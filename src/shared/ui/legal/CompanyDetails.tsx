/** Public company particulars checked against Companies House on 3 November 2026. */
export function CompanyDetails() {
  return (
    <section aria-label="Company details" className="space-y-2 text-sm leading-6 text-slate-600">
      <h2 className="text-base font-semibold text-slate-900">Company details</h2>
      <p>TruCycle Ltd is a company registered in England and Wales, company number{' '}
        <a className="font-medium underline underline-offset-4" href="https://find-and-update.company-information.service.gov.uk/company/16478005">16478005</a>.
      </p>
      <p>Registered office: Royal Docks Centre for Sustainability, 4–6 University Way, London, E16 2RD.</p>
      <p>General enquiries: <a className="font-medium underline underline-offset-4" href="mailto:hello@trucycle.co.uk">hello@trucycle.co.uk</a>.</p>
    </section>
  )
}
