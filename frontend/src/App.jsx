
import { useEffect, useState } from 'react'
import {
  BriefcaseBusiness, Plus, Search, LayoutDashboard, Clock,
  CheckCircle2, XCircle, CalendarDays, Pencil, Trash2,
  RefreshCw, X, Building2, FileText, History, Filter
} from 'lucide-react'
import './App.css'

const API ="https://newproject-pzj3.onrender.com/api/applications";
const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Accepted', 'Declined']
const FINAL = ['Rejected', 'Accepted', 'Declined']

const NEXT = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: ['Accepted', 'Declined'],
  Rejected: [],
  Accepted: [],
  Declined: [],
}

const EMPTY_FORM = {
  companyName: '',
  jobRole: '',
  jobType: 'Full-time',
  appliedDate: new Date().toLocaleDateString('en-CA'),
  expectedSalary: '',
  notes: '',
}

function prettyDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function App() {
  const [applications, setApplications] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [details, setDetails] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  async function loadApplications() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('company', search.trim())
      if (statusFilter !== 'All') params.set('status', statusFilter)

      const response = await fetch(`${API}?${params.toString()}`)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not load applications')
      setApplications(result.data?.applications || [])
      setCounts(result.data?.counts || {})
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [search, statusFilter])

  function openAdd() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, appliedDate: new Date().toLocaleDateString('en-CA') })
    setError('')
    setModal(true)
  }

  function openEdit(app) {
    setEditing(app)
    setForm({
      companyName: app.companyName,
      jobRole: app.jobRole,
      jobType: app.jobType,
      appliedDate: app.appliedDate?.slice(0, 10) || EMPTY_FORM.appliedDate,
      expectedSalary: app.expectedSalary ?? '',
      notes: app.notes || '',
    })
    setError('')
    setModal(true)
  }

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submitForm(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.companyName.trim() || !form.jobRole.trim()) {
      setError('Please enter both company name and job role.')
      return
    }
    if (!form.appliedDate || form.appliedDate > new Date().toLocaleDateString('en-CA')) {
      setError('Applied date cannot be in the future.')
      return
    }
    if (form.expectedSalary !== '' && Number(form.expectedSalary) < 0) {
      setError('Salary cannot be negative.')
      return
    }

    const body = {
      companyName: form.companyName.trim(),
      jobRole: form.jobRole.trim(),
      jobType: form.jobType,
      expectedSalary: form.expectedSalary === '' ? null : Number(form.expectedSalary),
      notes: form.notes.trim(),
    }
    if (!editing) body.appliedDate = form.appliedDate

    setSaving(true)
    try {
      const response = await fetch(editing ? `${API}/${editing._id}` : API, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not save application')
      setModal(false)
      setNotice(editing ? 'Application updated successfully.' : 'Application added successfully.')
      await loadApplications()
    } catch (err) {
      setError(err.message || 'Unable to save application.')
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(app, status) {
    if (!status || status === app.status) return
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${API}/${app._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not update status')
      setNotice(`Status updated to ${status}.`)
      await loadApplications()
      if (details?._id === app._id) {
        const detailResponse = await fetch(`${API}/${app._id}`)
        const detailResult = await detailResponse.json()
        if (detailResponse.ok) setDetails(detailResult.data)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteApplication(app) {
    const allowed = app.status === 'Applied' || FINAL.includes(app.status)
    if (!allowed) return
    if (!window.confirm(`Delete the application for ${app.companyName} — ${app.jobRole}?`)) return
    setError('')
    try {
      const response = await fetch(`${API}/${app._id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not delete application')
      setNotice('Application deleted.')
      if (details?._id === app._id) setDetails(null)
      await loadApplications()
    } catch (err) {
      setError(err.message)
    }
  }

  async function openDetails(app) {
    setError('')
    try {
      const response = await fetch(`${API}/${app._id}`)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not load details')
      setDetails(result.data)
    } catch (err) {
      setError(err.message)
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)
  const overdue = applications.filter(app => app.isOverdue).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><BriefcaseBusiness size={22} /></div>
          <div><strong>CareerTrack</strong><span>JOB APPLICATIONS</span></div>
        </div>
        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active"><LayoutDashboard size={18} /> Dashboard</button>
        <button className="nav-item" onClick={() => { setStatusFilter('Applied'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <Clock size={18} /> Applied jobs
        </button>
        <button className="nav-item" onClick={() => { setStatusFilter('Interview'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          <CalendarDays size={18} /> Interviews
        </button>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><CheckCircle2 size={18} /></div>
            <strong>Small steps, big career.</strong>
            <p>Keep your applications organized and your next opportunity in sight.</p>
          </div>
          <span className="version">JOB TRACKER · V1.0</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">YOUR CAREER, ORGANIZED</p>
            <h1>Job Applications</h1>
            <p className="subtitle">Keep every opportunity moving forward.</p>
          </div>
          <button className="primary-btn" onClick={openAdd}><Plus size={18} /> Add application</button>
        </header>

        {error && <div className="alert error-alert">{error}<button onClick={() => setError('')}><X size={16} /></button></div>}
        {notice && <div className="alert success-alert">{notice}<button onClick={() => setNotice('')}><X size={16} /></button></div>}

        <section className="stats-grid">
          <div className="stat-card"><div className="stat-top"><span>Total applications</span><span className="stat-icon purple"><BriefcaseBusiness size={18} /></span></div><strong>{total}</strong><small>Across all statuses</small></div>
          <div className="stat-card"><div className="stat-top"><span>Interviews</span><span className="stat-icon blue"><CalendarDays size={18} /></span></div><strong>{counts.Interview || 0}</strong><small>Opportunities in progress</small></div>
          <div className="stat-card"><div className="stat-top"><span>Offers</span><span className="stat-icon green"><CheckCircle2 size={18} /></span></div><strong>{counts.Offer || 0}</strong><small>Potential next steps</small></div>
          <div className="stat-card"><div className="stat-top"><span>Follow-ups due</span><span className="stat-icon orange"><Clock size={18} /></span></div><strong>{overdue}</strong><small>Applications needing attention</small></div>
        </section>

        <section className="applications-section">
          <div className="section-heading">
            <div><h2>All applications</h2><p>Review and manage your job search.</p></div>
            <button className="refresh-btn" onClick={loadApplications} title="Refresh"><RefreshCw size={17} /> Refresh</button>
          </div>

          <div className="toolbar">
            <label className="search-box"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company..." /></label>
            <label className="filter-box"><Filter size={17} /><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>
          </div>

          {loading ? <div className="empty-state"><RefreshCw className="spin" size={26} /><p>Loading applications…</p></div> : applications.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={26} /></div><h3>No applications found</h3><p>Add your first job application or adjust your search.</p><button className="primary-btn" onClick={openAdd}><Plus size={17} /> Add application</button></div>
          ) : (
            <div className="table-wrap"><table><thead><tr><th>APPLICATION</th><th>JOB TYPE</th><th>APPLIED DATE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>
              {applications.map(app => (
                <tr key={app._id}>
                  <td><button className="company-cell" onClick={() => openDetails(app)}><span className="company-avatar"><Building2 size={19} /></span><span><strong>{app.companyName}</strong><small>{app.jobRole}</small><em>{app.applicationId}</em></span></button></td>
                  <td>{app.jobType}</td>
                  <td><span className="date-cell">{prettyDate(app.appliedDate)}</span>{app.isOverdue && <small className="overdue-label">Follow-up overdue</small>}</td>
                  <td><span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span></td>
                  <td><div className="action-group">
                    <button className="icon-btn" title="Edit" onClick={() => openEdit(app)}><Pencil size={16} /></button>
                    <button className="icon-btn" title="View history" onClick={() => openDetails(app)}><History size={16} /></button>
                    <button className="icon-btn danger-btn" title={app.status === 'Interview' || app.status === 'Offer' ? 'Cannot delete at this stage' : 'Delete'} disabled={app.status === 'Interview' || app.status === 'Offer'} onClick={() => deleteApplication(app)}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody></table></div>
          )}
        </section>
        <footer className="footer">Made for your next opportunity <span>✦</span> CareerTrack</footer>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}>
        <section className="modal-card">
          <div className="modal-heading"><div><p className="eyebrow">{editing ? 'UPDATE DETAILS' : 'NEW OPPORTUNITY'}</p><h2>{editing ? 'Edit application' : 'Add application'}</h2></div><button className="icon-btn" onClick={() => setModal(false)}><X size={20} /></button></div>
          <form onSubmit={submitForm}>
            <div className="form-grid">
              <label>Company name *<input name="companyName" value={form.companyName} onChange={updateField} placeholder="e.g. Infosys" required /></label>
              <label>Job role *<input name="jobRole" value={form.jobRole} onChange={updateField} placeholder="e.g. Software Engineer" required /></label>
              <label>Job type *<select name="jobType" value={form.jobType} onChange={updateField}><option>Full-time</option><option>Internship</option><option>Contract</option></select></label>
              <label>Applied date *<input type="date" name="appliedDate" value={form.appliedDate} onChange={updateField} max={new Date().toLocaleDateString('en-CA')} disabled={Boolean(editing)} required /></label>
              <label>Expected salary (optional)<input type="number" name="expectedSalary" min="0" value={form.expectedSalary} onChange={updateField} placeholder="e.g. 600000" /></label>
              <label className="full-field">Notes (optional)<textarea name="notes" rows="3" value={form.notes} onChange={updateField} placeholder="Recruiter contact, reminders, interview notes..." /></label>
            </div>
            <p className="form-hint"><CalendarDays size={15} /> Follow-up is automatically scheduled 7 days after applying.</p>
            <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="primary-btn" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add application'}</button></div>
          </form>
        </section>
      </div>}

      {details && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setDetails(null) }}>
        <section className="modal-card details-card">
          <div className="modal-heading"><div><p className="eyebrow">APPLICATION DETAILS</p><h2>{details.companyName}</h2><p className="subtitle">{details.jobRole} · {details.applicationId}</p></div><button className="icon-btn" onClick={() => setDetails(null)}><X size={20} /></button></div>
          <div className="detail-meta"><span className={`status-badge status-${details.status.toLowerCase()}`}>{details.status}</span><span>{details.jobType}</span><span>Applied {prettyDate(details.appliedDate)}</span></div>
          <label className="status-update">Update status
            <select value="" onChange={e => changeStatus(details, e.target.value)}>
              <option value="">Choose next status…</option>
              {(NEXT[details.status] || []).map(status => <option key={status}>{status}</option>)}
            </select>
          </label>
          <div className="timeline-heading"><History size={18} /><h3>Status history</h3></div>
          <div className="timeline">{(details.statusHistory || []).slice().reverse().map((item, index) => <div className="timeline-item" key={`${item.status}-${index}`}><span className="timeline-dot" /><div><strong>{item.status}</strong><small>{prettyDate(item.date)}</small></div></div>)}</div>
          {details.notes && <div className="notes-box"><FileText size={17} /><div><strong>Notes</strong><p>{details.notes}</p></div></div>}
          <div className="modal-actions"><button className="secondary-btn" onClick={() => setDetails(null)}>Close</button><button className="primary-btn" onClick={() => { setDetails(null); openEdit(details) }}><Pencil size={16} /> Edit details</button></div>
        </section>
      </div>}
    </div>
  )
}

export default App
