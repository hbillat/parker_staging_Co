'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface LeadWithSource {
  id: string
  business_name: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  website: string | null
  google_url: string | null
  rating: number | null
  review_count: number | null
  times_found: number
  first_seen_at: string
  created_at: string
  source_project: string
  first_found_date: string
  total_projects: number
}

type SortField = keyof LeadWithSource
type SortDirection = 'asc' | 'desc'

interface AllLeadsTableProps {
  leads: LeadWithSource[]
}

export default function AllLeadsTable({ leads }: AllLeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>('times_found')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to descending
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const filteredAndSortedLeads = useMemo(() => {
    let filtered = leads

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = leads.filter(lead =>
        lead.business_name.toLowerCase().includes(search) ||
        lead.address?.toLowerCase().includes(search) ||
        lead.city?.toLowerCase().includes(search) ||
        lead.phone?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.website?.toLowerCase().includes(search)
      )
    }

    // Sort
    return [...filtered].sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]

      // Handle null/undefined
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Compare
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [leads, sortField, sortDirection, searchTerm])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-slate-400">⇅</span>
    }
    return <span className="text-slate-900">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-slate-600">
        <p className="text-lg">No leads found yet.</p>
        <p className="text-sm mt-2">Create a project and start scraping to see leads here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search leads by name, address, phone, email, website..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-slate-600 hover:text-slate-900 text-sm"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-600">
        Showing {filteredAndSortedLeads.length} of {leads.length} leads
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('business_name')}
              >
                Business Name <SortIcon field="business_name" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('times_found')}
              >
                Times Found <SortIcon field="times_found" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('rating')}
              >
                Rating <SortIcon field="rating" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('review_count')}
              >
                Reviews <SortIcon field="review_count" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('address')}
              >
                Location <SortIcon field="address" />
              </th>
              <th className="text-left py-3 px-4 font-semibold text-slate-900">
                Contact
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('source_project')}
              >
                First Source <SortIcon field="source_project" />
              </th>
              <th
                className="text-left py-3 px-4 font-semibold text-slate-900 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('first_found_date')}
              >
                First Found <SortIcon field="first_found_date" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedLeads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-900">{lead.business_name}</div>
                  {lead.website && (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  )}
                  {lead.google_url && (
                    <>
                      {lead.website && ' • '}
                      <a
                        href={lead.google_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Google
                      </a>
                    </>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{lead.times_found}</span>
                    <span className="text-xs text-slate-500">
                      ({lead.total_projects} {lead.total_projects === 1 ? 'project' : 'projects'})
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {lead.rating ? (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-900">{lead.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {lead.review_count ? lead.review_count.toLocaleString() : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="text-slate-900">{lead.address || '-'}</div>
                  {(lead.city || lead.state) && (
                    <div className="text-xs text-slate-500">
                      {lead.city}
                      {lead.city && lead.state && ', '}
                      {lead.state}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    {lead.phone && (
                      <div>
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-slate-900 hover:text-blue-600 text-xs"
                        >
                          {lead.phone}
                        </a>
                      </div>
                    )}
                    {lead.email && (
                      <div>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-slate-900 hover:text-blue-600 text-xs"
                        >
                          {lead.email}
                        </a>
                      </div>
                    )}
                    {!lead.phone && !lead.email && (
                      <span className="text-slate-400 text-xs">No contact</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600">
                  {lead.source_project}
                </td>
                <td className="py-3 px-4 text-slate-600 text-xs">
                  {formatDistanceToNow(new Date(lead.first_found_date), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

