'use client'

import { Lead } from '@/types/database'

interface LeadsTableProps {
  leads: Lead[]
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600">
        <p>No leads collected yet. Start scraping to see results here.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
              Business Name
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
              Address
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
              Phone
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
              Website
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
              Rating
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">
              Reviews
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4">
                <div className="font-medium text-slate-900">{lead.business_name}</div>
                {lead.google_url && (
                  <a
                    href={lead.google_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on Google
                  </a>
                )}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                {lead.address || '-'}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="hover:text-slate-900">
                    {lead.phone}
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="py-3 px-4 text-sm">
                {lead.rating ? (
                  <div className="flex items-center gap-1">
                    <span className="text-slate-900 font-medium">{lead.rating}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                ) : (
                  '-'
                )}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600">
                {lead.review_count ? lead.review_count.toLocaleString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

