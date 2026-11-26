/** User guidance only; this does not record or certify a completed handover check. */
export function ReuseSafetyNotice() {
  return (
    <aside aria-label="Reuse guidance" className="rounded-xl border border-emerald-900/20 bg-emerald-50/60 p-4 text-sm leading-6 text-slate-700">
      <h3 className="font-semibold text-slate-900">Before you offer an item</h3>
      <p className="mt-1">Offer only an item you own or have the owner&apos;s permission to pass on. It should be safe to use for its original purpose. Describe any damage or minor repair clearly before agreeing a handover.</p>
      <details className="mt-2">
        <summary tabIndex={0} className="flex min-h-11 cursor-pointer items-center font-semibold text-emerald-900 underline underline-offset-4">Item restrictions and handover guidance</summary>
        <div className="space-y-3 pt-2">
          <ul className="list-disc space-y-2 pl-5">
            <li>Do not offer dumped or fly-tipped items, items from skips, or items already put out for a council bulky collection. Do not assume an unattended item belongs to nobody.</li>
            <li>Do not offer items with pests, mould, damp damage, broken glass, sharp edges or damage needing more than minor repair.</li>
            <li>Mattresses and toppers, fridges and freezers, powered recliners, gas appliances, child car seats, hazardous materials and loose batteries are excluded from this reuse route.</li>
            <li>Do not use this route for house or office clearance lots, business items, end-of-tenancy items passed on by a landlord or agent, fitted carpet or underlay, food, or clinical and medical items.</li>
            <li>Upholstered furniture needs its permanent fire-safety label. Electrical items must work and have an intact plug, cable and casing. Check the model and serial number against the manufacturer&apos;s recall information and the{' '}<a className="underline underline-offset-4" href="https://www.gov.uk/product-safety-alerts-reports-recalls">GOV.UK product recall service</a>.</li>
            <li>Check the condition together before the item moves. Both parties should agree any minor repair and who will complete it. This guidance is not a safety certificate or a completed check record.</li>
          </ul>
          <p>Keep people, personal documents, house numbers and vehicle number plates out of item photos. Include only the location details needed to arrange the handover.</p>
          <p>For an item that cannot be reused, contact your council or an appropriate service yourself. For suspected fly-tipping, see{' '}<a className="underline underline-offset-4" href="https://www.gov.uk/report-flytipping">GOV.UK reporting guidance</a>. These links provide information; they do not book a collection.</p>
        </div>
      </details>
    </aside>
  )
}
