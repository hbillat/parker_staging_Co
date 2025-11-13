'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function EmailFinderButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/leads/find-emails')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const findEmails = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/leads/find-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: 10 }),
      })
      
      const data = await response.json()
      setResult(data)
      
      // Refresh stats after finding
      await fetchStats()
    } catch (error) {
      console.error('Error finding emails:', error)
      setResult({ error: 'Failed to find emails' })
    } finally {
      setLoading(false)
    }
  }

  // Load stats on mount
  if (!stats && !loading) {
    fetchStats()
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Email Finder</h3>
        <p className="text-sm text-slate-600">
          Automatically find email addresses from lead websites
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-600">Total Leads</div>
            <div className="text-2xl font-bold text-slate-900">{stats.total_leads}</div>
          </div>
          <div>
            <div className="text-slate-600">With Email</div>
            <div className="text-2xl font-bold text-green-600">{stats.leads_with_email}</div>
          </div>
          <div>
            <div className="text-slate-600">With Website</div>
            <div className="text-2xl font-bold text-blue-600">{stats.leads_with_website}</div>
          </div>
          <div>
            <div className="text-slate-600">Ready to Process</div>
            <div className="text-2xl font-bold text-orange-600">{stats.ready_to_process}</div>
          </div>
        </div>
      )}

      <Button
        onClick={findEmails}
        disabled={loading || (stats && stats.ready_to_process === 0)}
        className="w-full"
      >
        {loading ? 'Finding Emails...' : 'Find Emails (10 leads)'}
      </Button>

      {result && (
        <div className={`p-4 rounded-lg ${result.error ? 'bg-red-50' : 'bg-green-50'}`}>
          {result.error ? (
            <p className="text-red-900 text-sm">{result.error}</p>
          ) : (
            <div className="space-y-2">
              <p className="text-green-900 font-medium text-sm">
                ✓ {result.message}
              </p>
              {result.results && result.results.length > 0 && (
                <div className="space-y-1 mt-2">
                  {result.results.map((r: any, i: number) => (
                    <div key={i} className="text-xs text-slate-700">
                      <span className="font-medium">{r.business_name}:</span> {r.email}
                      <span className="text-slate-500 ml-2">
                        ({r.confidence} confidence, {r.source})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <p>• Processes 10 leads at a time</p>
        <p>• Searches lead websites for email addresses</p>
        <p>• Safe to run multiple times</p>
      </div>
    </div>
  )
}

