import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientMesh from '@/components/GradientMesh'
import Nav from '@/components/Nav'
import LoadingSpinner from '@/components/LoadingSpinner'
import { hasProfile, saveMetric, seedMockData } from '@/lib/storage'
import { importHealthFile } from '@/lib/health-import'
import { syncFromSupabase, getWebhookUrl } from '@/lib/supabase-sync'
import { getDeviceUserId } from '@/lib/storage'
import {
  redirectToStrava,
  handleStravaCallback,
  syncStravaActivities,
  isStravaConnected,
  clearStravaTokens,
} from '@/lib/strava'

type ImportStatus = 'idle' | 'parsing' | 'done' | 'error'
type SyncStatus = 'idle' | 'syncing' | 'done' | 'error'
type Tab = 'apple' | 'strava' | 'google'

const LAST_SYNC_KEY = 'healthmapr_last_sync'

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function HealthConnect() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('apple')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import state
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [importResult, setImportResult] = useState<{ count: number; warnings: string[] } | null>(null)
  const [importError, setImportError] = useState('')

  // Shortcut sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)
  const [syncError, setSyncError] = useState('')
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Strava state
  const [stravaConnected, setStravaConnected] = useState(false)
  const [stravaStatus, setStravaStatus] = useState<SyncStatus>('idle')
  const [stravaResult, setStravaResult] = useState<{ synced: number } | null>(null)
  const [stravaError, setStravaError] = useState('')

  // Shortcut section
  const [showDeviceId, setShowDeviceId] = useState(false)
  const [copied, setCopied] = useState<'url' | 'id' | null>(null)

  const webhookUrl = getWebhookUrl()
  const deviceId = getDeviceUserId()

  useEffect(() => {
    seedMockData()
    if (!hasProfile()) { navigate('/setup', { replace: true }); return }
    setLastSync(localStorage.getItem(LAST_SYNC_KEY))
    setStravaConnected(isStravaConnected())

    // Handle Strava OAuth callback (?code=... in URL)
    if (window.location.search.includes('state=strava_oauth')) {
      setTab('strava')
      handleStravaCallback().then((ok) => {
        if (ok) setStravaConnected(true)
      })
    }

    setLoading(false)
  }, [navigate])

  // ── File import ──────────────────────────────────────────────────────────

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('parsing')
    setImportResult(null)
    setImportError('')

    try {
      const result = await importHealthFile(file)
      if (result.metrics.length === 0) {
        setImportError(result.warnings[0] ?? 'No health data found in this file.')
        setImportStatus('error')
        return
      }
      // Merge into localStorage
      for (const m of result.metrics) {
        saveMetric(m)
      }
      setImportResult({ count: result.daysImported, warnings: result.warnings })
      setImportStatus('done')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to parse file')
      setImportStatus('error')
    }

    // Reset input so user can re-import
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ── Supabase sync ────────────────────────────────────────────────────────

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing')
    setSyncResult(null)
    setSyncError('')

    const result = await syncFromSupabase(90)
    if (result.error) {
      setSyncError(result.error)
      setSyncStatus('error')
      return
    }
    const now = new Date().toISOString()
    localStorage.setItem(LAST_SYNC_KEY, now)
    setLastSync(now)
    setSyncResult({ synced: result.synced })
    setSyncStatus('done')
  }, [])

  // ── Strava sync ──────────────────────────────────────────────────────────────

  const handleStravaSync = useCallback(async () => {
    setStravaStatus('syncing')
    setStravaResult(null)
    setStravaError('')
    const result = await syncStravaActivities(90)
    if (result.error) {
      setStravaError(result.error)
      setStravaStatus('error')
      if (result.error.includes('401')) setStravaConnected(false)
      return
    }
    setStravaResult({ synced: result.synced })
    setStravaStatus('done')
  }, [])

  // ── Copy to clipboard ────────────────────────────────────────────────────

  const copyText = useCallback(async (text: string, which: 'url' | 'id') => {
    await navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }, [])

  if (loading) return <LoadingSpinner fullScreen />

  const glass = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderTop: '1px solid rgba(255,255,255,0.16)',
  }

  return (
    <div className="min-h-dvh pb-32">
      <GradientMesh />

      {/* ── Header ── */}
      <div
        className="px-5 pb-4"
        style={{ paddingTop: 'max(24px, calc(var(--safe-top) + 16px))' }}
      >
        <p className="text-[13px] text-white/35 mb-1">Live data</p>
        <h1 className="text-[28px] font-black text-white/95" style={{ letterSpacing: '-0.02em' }}>
          Connect
        </h1>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-5 mb-5">
        <div
          className="flex items-center rounded-2xl p-1 gap-1"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {([
            { id: 'apple' as Tab, label: '❤️ Apple Health', badge: undefined as string | undefined },
            { id: 'strava' as Tab, label: '🟠 Strava', badge: stravaConnected ? '●' : undefined as string | undefined },
            { id: 'google' as Tab, label: '🔵 Google Fit', badge: undefined as string | undefined },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1"
              style={tab === t.id
                ? { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.90)', border: '1px solid rgba(255,255,255,0.12)' }
                : { color: 'rgba(255,255,255,0.35)' }
              }
            >
              {t.label}
              {t.badge && <span className="text-[8px] text-[#30D158]">{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">

        {/* ══════════════════ APPLE HEALTH TAB ══════════════════ */}
        {tab === 'apple' && <>

        {/* ── Section 1: XML Import ── */}
        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.25)' }}
            >
              ❤️
            </div>
            <div>
              <div className="text-[15px] font-bold text-white/88">Import Health Data</div>
              <div className="text-[12px] text-white/40">Upload your Apple Health export file</div>
            </div>
          </div>

          {/* How to export */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2.5">How to export from iPhone</div>
            {[
              'Open the Health app on your iPhone',
              'Tap your profile photo (top right)',
              'Scroll down and tap "Export All Health Data"',
              'Tap "Export" and share the ZIP file here',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3 mb-2 last:mb-0">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold mt-0.5"
                  style={{ background: 'rgba(255,69,58,0.18)', color: '#FF453A' }}
                >
                  {i + 1}
                </div>
                <span className="text-[13px] text-white/55 leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {/* Drop zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.xml"
            onChange={handleFileChange}
            className="hidden"
            id="health-file-input"
          />
          <label
            htmlFor="health-file-input"
            className="block w-full rounded-2xl p-5 text-center cursor-pointer transition-all active:scale-[0.98]"
            style={{
              background: importStatus === 'done'
                ? 'rgba(48,209,88,0.08)'
                : 'rgba(255,69,58,0.07)',
              border: importStatus === 'done'
                ? '1px dashed rgba(48,209,88,0.35)'
                : '1px dashed rgba(255,69,58,0.35)',
            }}
          >
            {importStatus === 'idle' && (
              <>
                <div className="text-2xl mb-2">📂</div>
                <div className="text-[14px] font-bold text-white/70 mb-0.5">Tap to upload file</div>
                <div className="text-[12px] text-white/35">export.zip or export.xml · last 90 days imported</div>
              </>
            )}
            {importStatus === 'parsing' && (
              <>
                <div className="text-2xl mb-2 animate-pulse">⏳</div>
                <div className="text-[14px] font-bold text-white/70">Parsing your health data…</div>
                <div className="text-[12px] text-white/35 mt-0.5">Large exports may take a moment</div>
              </>
            )}
            {importStatus === 'done' && importResult && (
              <>
                <div className="text-2xl mb-2">✅</div>
                <div className="text-[14px] font-bold text-[#30D158] mb-0.5">
                  {importResult.count} days imported
                </div>
                <div className="text-[12px] text-white/40">Tap to import again with a newer export</div>
              </>
            )}
            {importStatus === 'error' && (
              <>
                <div className="text-2xl mb-2">⚠️</div>
                <div className="text-[13px] text-[#FF453A] mb-0.5">{importError}</div>
                <div className="text-[12px] text-white/35">Tap to try again</div>
              </>
            )}
          </label>

          {importResult?.warnings?.length ? (
            <div className="mt-3">
              {importResult.warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-[#FFD60A] mt-1">⚠ {w}</p>
              ))}
            </div>
          ) : null}
        </div>

        {/* ── Section 2: iOS Shortcut auto-sync ── */}
        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.25)' }}
            >
              ⚡
            </div>
            <div>
              <div className="text-[15px] font-bold text-white/88">Auto-Sync via Shortcut</div>
              <div className="text-[12px] text-white/40">Daily sync using iOS Shortcuts + Apple Watch</div>
            </div>
          </div>

          {/* How it works */}
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: 'rgba(10,132,255,0.07)', border: '1px solid rgba(10,132,255,0.15)' }}
          >
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2">How it works</div>
            <p className="text-[13px] text-white/50 leading-relaxed">
              You create a 5-minute iOS Shortcut that reads your HealthKit data and sends it to HealthMapr. Set it to run automatically each morning — tap Sync here to pull it into the app.
            </p>
          </div>

          {/* Step-by-step Shortcut setup */}
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-3">Build the Shortcut</div>

            <div className="flex flex-col gap-2.5">
              {[
                {
                  n: '1', title: 'Open Shortcuts app', sub: 'Tap the + to create a new shortcut',
                },
                {
                  n: '2', title: 'Add "Get Health Samples" actions', sub: 'One each for: Steps (Quantity · Today · Sum), Sleep (Category · Last Night · Sum), Body Mass (Quantity · Latest), Dietary Energy (Quantity · Today · Sum)',
                },
                {
                  n: '3', title: 'Add "Get Contents of URL" action',
                  sub: `Method: POST · URL: tap "Copy webhook URL" below`,
                },
                {
                  n: '4', title: 'Set the request body', sub: 'Type: JSON · Add keys: device_id, date, steps, sleep_hours, weight_kg, calories_in · Map each to its Health Sample output',
                },
                {
                  n: '5', title: 'Automate it', sub: 'Shortcuts → Automation → + → Time of Day → 7:00 AM → Run Shortcut → select yours',
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div
                    className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold mt-0.5"
                    style={{ background: 'rgba(10,132,255,0.18)', color: '#0A84FF' }}
                  >
                    {s.n}
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white/80 mb-0.5">{s.title}</div>
                    <div className="text-[12px] text-white/40 leading-relaxed">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook URL */}
          <div className="mb-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5">Your webhook URL</div>
            <div
              className="flex items-center gap-2 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex-1 text-[12px] text-white/50 font-mono break-all leading-relaxed">
                {webhookUrl || 'Supabase URL not configured'}
              </div>
              {webhookUrl && (
                <button
                  onClick={() => copyText(webhookUrl, 'url')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
                  style={copied === 'url'
                    ? { background: 'rgba(48,209,88,0.15)', color: '#30D158' }
                    : { background: 'rgba(10,132,255,0.15)', color: '#0A84FF', border: '1px solid rgba(10,132,255,0.25)' }
                  }
                >
                  {copied === 'url' ? '✓ Copied' : 'Copy'}
                </button>
              )}
            </div>
          </div>

          {/* Device ID */}
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5">
              Your device ID{' '}
              <button
                onClick={() => setShowDeviceId(!showDeviceId)}
                className="text-white/25 hover:text-white/50 transition-colors normal-case font-normal tracking-normal ml-1"
              >
                {showDeviceId ? '(hide)' : '(show)'}
              </button>
            </div>
            <div
              className="flex items-center gap-2 p-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex-1 text-[12px] text-white/50 font-mono break-all">
                {showDeviceId ? deviceId : '••••••••-••••-••••-••••-••••••••••••'}
              </div>
              <button
                onClick={() => copyText(deviceId, 'id')}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
                style={copied === 'id'
                  ? { background: 'rgba(48,209,88,0.15)', color: '#30D158' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' }
                }
              >
                {copied === 'id' ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] text-white/25 mt-1.5 leading-relaxed">
              Add this as the <span className="font-mono text-white/40">device_id</span> field in your Shortcut's JSON body. It links the data to this device.
            </p>
          </div>

          {/* Sync button */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-1.5">
              Pull latest data
              {lastSync && (
                <span className="normal-case font-normal tracking-normal text-white/25 ml-2">
                  Last synced {timeAgo(lastSync)}
                </span>
              )}
            </div>
            <button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className="w-full py-3.5 rounded-2xl text-[14px] font-bold transition-all active:scale-[0.98]"
              style={syncStatus === 'syncing'
                ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.30)' }
                : syncStatus === 'done'
                ? { background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }
                : syncStatus === 'error'
                ? { background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.25)', color: '#FF453A' }
                : { background: 'linear-gradient(135deg, rgba(10,132,255,0.25), rgba(191,90,242,0.20))', border: '1px solid rgba(10,132,255,0.35)', color: '#5AA8FF' }
              }
            >
              {syncStatus === 'syncing' && '⏳ Syncing from cloud…'}
              {syncStatus === 'done' && syncResult && `✓ ${syncResult.synced} entries pulled`}
              {syncStatus === 'error' && '⚠ Sync failed — tap to retry'}
              {(syncStatus === 'idle') && '↓ Sync from cloud'}
            </button>
            {syncStatus === 'error' && syncError && (
              <p className="text-[11px] text-[#FF453A] mt-1.5">{syncError}</p>
            )}
          </div>
        </div>

        {/* ── Section 3: What we track ── */}
        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-3">What gets imported</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '🏃', label: 'Steps', src: 'iPhone + Apple Watch' },
              { icon: '🛌', label: 'Sleep', src: 'Apple Watch' },
              { icon: '⚖️', label: 'Weight', src: 'Apple Watch / Health app' },
              { icon: '⚡', label: 'Calories in', src: 'MyFitnessPal / Cronometer' },
            ].map((item) => (
              <div
                key={item.label}
                className="p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-[13px] font-bold text-white/75">{item.label}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{item.src}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/25 mt-3 leading-relaxed">
            Calories in requires a nutrition app (e.g. MyFitnessPal, Cronometer, or Lose It!) connected to Apple Health.
          </p>
        </div>

        </> /* end Apple tab */ }

        {/* ══════════════════ STRAVA TAB ══════════════════ */}
        {tab === 'strava' && <>

        {/* Connect / status card */}
        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(252,76,2,0.15)', border: '1px solid rgba(252,76,2,0.30)' }}
            >
              🟠
            </div>
            <div>
              <div className="text-[15px] font-bold text-white/88">Strava</div>
              <div className="text-[12px]" style={{ color: stravaConnected ? '#30D158' : 'rgba(255,255,255,0.40)' }}>
                {stravaConnected ? '● Connected' : 'Not connected'}
              </div>
            </div>
            {stravaConnected && (
              <button
                onClick={() => { clearStravaTokens(); setStravaConnected(false) }}
                className="ml-auto text-[11px] text-white/30 hover:text-[#FF453A] transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>

          {!stravaConnected ? (
            <button
              onClick={redirectToStrava}
              className="w-full py-4 rounded-2xl text-[14px] font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #FC4C02, #E34402)', boxShadow: '0 4px 20px rgba(252,76,2,0.35)' }}
            >
              Connect Strava →
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={handleStravaSync}
                disabled={stravaStatus === 'syncing'}
                className="w-full py-3.5 rounded-2xl text-[14px] font-bold transition-all active:scale-[0.98]"
                style={stravaStatus === 'done'
                  ? { background: 'rgba(48,209,88,0.12)', border: '1px solid rgba(48,209,88,0.25)', color: '#30D158' }
                  : stravaStatus === 'error'
                  ? { background: 'rgba(255,69,58,0.10)', border: '1px solid rgba(255,69,58,0.25)', color: '#FF453A' }
                  : { background: 'linear-gradient(135deg, rgba(252,76,2,0.25), rgba(252,76,2,0.15))', border: '1px solid rgba(252,76,2,0.35)', color: '#FC8C60' }
                }
              >
                {stravaStatus === 'syncing' && '⏳ Syncing activities…'}
                {stravaStatus === 'done' && stravaResult && `✓ ${stravaResult.synced} days synced`}
                {stravaStatus === 'error' && '⚠ Sync failed — tap to retry'}
                {stravaStatus === 'idle' && '↓ Sync last 90 days'}
              </button>
              {stravaStatus === 'error' && stravaError && (
                <p className="text-[11px] text-[#FF453A]">{stravaError}</p>
              )}
            </div>
          )}
        </div>

        {/* What Strava provides */}
        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-3">What Strava syncs</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '🏃', label: 'Runs', src: 'GPS + pace data' },
              { icon: '🚴', label: 'Rides', src: 'Power, cadence, speed' },
              { icon: '🏊', label: 'Swims', src: 'Pool + open water' },
              { icon: '🔥', label: 'Calories burned', src: 'Per workout' },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-[13px] font-bold text-white/75">{item.label}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{item.src}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white/25 mt-3 leading-relaxed">
            You need a Strava app registered at developers.strava.com. Add <span className="font-mono text-white/40">VITE_STRAVA_CLIENT_ID</span> to your .env and <span className="font-mono text-white/40">STRAVA_CLIENT_ID</span> + <span className="font-mono text-white/40">STRAVA_CLIENT_SECRET</span> as Supabase secrets.
          </p>
        </div>

        </> /* end Strava tab */ }

        {/* ══════════════════ GOOGLE FIT TAB ══════════════════ */}
        {tab === 'google' && <>

        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(66,133,244,0.15)', border: '1px solid rgba(66,133,244,0.25)' }}
            >
              🔵
            </div>
            <div>
              <div className="text-[15px] font-bold text-white/88">Google Fit</div>
              <div className="text-[12px] text-white/40">Coming soon</div>
            </div>
          </div>

          <div className="rounded-2xl p-4 mb-4"
            style={{ background: 'rgba(66,133,244,0.07)', border: '1px solid rgba(66,133,244,0.15)' }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-2">Integration plan</div>
            <p className="text-[13px] text-white/50 leading-relaxed">
              Google Fit uses the same OAuth 2.0 pattern as Strava. Once your Supabase env is set up, it will sync steps, sleep, and calories burned via the Fitness REST API.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { step: '1', text: 'Create a project at console.cloud.google.com' },
              { step: '2', text: 'Enable the Fitness API and create OAuth 2.0 credentials' },
              { step: '3', text: 'Add GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET as Supabase secrets' },
              { step: '4', text: 'Google Fit sync will unlock automatically' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3 p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold mt-0.5"
                  style={{ background: 'rgba(66,133,244,0.18)', color: '#4285F4' }}>
                  {s.step}
                </div>
                <span className="text-[13px] text-white/55 leading-relaxed">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What Google Fit provides */}
        <div className="rounded-3xl p-5 overflow-hidden" style={glass}>
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-3">What Google Fit syncs</div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: '🏃', label: 'Steps', src: 'Pixel Watch + phone' },
              { icon: '🛌', label: 'Sleep', src: 'Wear OS devices' },
              { icon: '🔥', label: 'Calories burned', src: 'Activity data' },
              { icon: '💪', label: 'Workouts', src: 'All activity types' },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-[13px] font-bold text-white/75">{item.label}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{item.src}</div>
              </div>
            ))}
          </div>
        </div>

        </> /* end Google Fit tab */ }

      </div>

      <Nav />
    </div>
  )
}
