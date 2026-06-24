'use client'

import { useMemo, useState } from 'react'

const REPORTS = [
  {
    type: 'sales',
    label: 'Sales Report',
    description: 'Revenue, discounts, average order value, and paid order performance.',
  },
  {
    type: 'orders',
    label: 'Orders Report',
    description: 'Operational order list with statuses, items, quantities, and totals.',
  },
  {
    type: 'clients',
    label: 'Client Report',
    description: 'Customer aggregation from orders, contact messages, and bespoke enquiries.',
  },
  {
    type: 'materials',
    label: 'Material Usage Report',
    description: 'Units sold and revenue grouped by marble/material demand.',
  },
] as const

function buildReportHref(
  type: string,
  format: 'csv' | 'pdf',
  fromDate: string,
  toDate: string,
) {
  const params = new URLSearchParams({ format })

  if (fromDate) params.set('from', fromDate)
  if (toDate) params.set('to', toDate)

  return `/api/admin/reports/${type}?${params.toString()}`
}

export default function AdminDashboardReports() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const hasInvalidRange = useMemo(
    () => Boolean(fromDate && toDate && fromDate > toDate),
    [fromDate, toDate],
  )

  const activeRangeLabel = useMemo(() => {
    if (fromDate && toDate) return `${fromDate} to ${toDate}`
    if (fromDate) return `From ${fromDate}`
    if (toDate) return `Until ${toDate}`
    return 'All time'
  }, [fromDate, toDate])

  return (
    <section className="bg-white border border-beige p-6 mb-10">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-gold font-sans">
            Business Reports
          </p>
          <h2 className="font-serif text-2xl text-stone mt-2">Download Reports</h2>
          <p className="text-sm font-sans text-stone-mid mt-2 max-w-2xl">
            Export management-ready reports from existing commerce, client, order, and material data.
          </p>
        </div>
        <p className="text-xs font-sans uppercase tracking-[0.2em] text-stone-pale">
          CSV and PDF
        </p>
      </div>

      <div className="border border-beige bg-cream px-4 py-4 mb-5">
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
              Report Range
            </p>
            <h3 className="font-serif text-lg text-stone mt-2">Filter By Date</h3>
            <p className="text-sm font-sans text-stone-mid mt-2">
              Apply one shared date range to every report download.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(0,180px)_minmax(0,180px)_auto] gap-3 xl:min-w-[520px]">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                From
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                max={toDate || undefined}
                className="border border-beige bg-white px-3 py-2 text-sm font-sans text-stone focus:outline-none focus:border-gold"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                To
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                min={fromDate || undefined}
                className="border border-beige bg-white px-3 py-2 text-sm font-sans text-stone focus:outline-none focus:border-gold"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFromDate('')
                  setToDate('')
                }}
                className="w-full xl:w-auto border border-beige bg-white text-stone-mid px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] hover:border-gold hover:text-gold transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs font-sans uppercase tracking-[0.18em] text-stone-mid">
            Active range: <span className="text-gold">{activeRangeLabel}</span>
          </p>
          {hasInvalidRange ? (
            <p className="text-xs font-sans text-red-700">
              The start date must be earlier than the end date.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {REPORTS.map((report) => {
          const csvHref = buildReportHref(report.type, 'csv', fromDate, toDate)
          const pdfHref = buildReportHref(report.type, 'pdf', fromDate, toDate)
          const disabledClasses = hasInvalidRange ? 'pointer-events-none opacity-50' : ''

          return (
            <div key={report.type} className="border border-beige bg-cream p-5 flex flex-col min-h-[210px]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-stone-pale font-sans">
                Export
              </p>
              <h3 className="font-serif text-xl text-stone mt-2">{report.label}</h3>
              <p className="text-sm font-sans text-stone-mid mt-3 leading-relaxed flex-1">
                {report.description}
              </p>
              <div className="grid grid-cols-2 gap-2 mt-5">
                <a
                  href={csvHref}
                  aria-disabled={hasInvalidRange}
                  className={`text-center border border-gold bg-gold text-white px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] hover:bg-gold-dark hover:border-gold-dark transition-colors ${disabledClasses}`}
                >
                  CSV
                </a>
                <a
                  href={pdfHref}
                  aria-disabled={hasInvalidRange}
                  className={`text-center border border-beige bg-white text-stone-mid px-4 py-2 text-xs font-sans uppercase tracking-[0.18em] hover:border-gold hover:text-gold transition-colors ${disabledClasses}`}
                >
                  PDF
                </a>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
