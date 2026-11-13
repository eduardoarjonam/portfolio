const examples = [
  {
    id: 'DEMO-042', title: 'Revisión de la unidad de climatización', site: 'Taller de ejemplo Norte', customer: 'norte',
    status: 'review', assignment: 'Equipo técnico A', date: '18 nov · 09:30',
    report: 'Se limpió el filtro, se comprobó la presión y se dejó el equipo operativo. La prueba final de funcionamiento quedó registrada.',
    signature: 'Conformidad registrada en la simulación.',
  },
  {
    id: 'DEMO-043', title: 'Ajuste del cuadro de ventilación', site: 'Edificio de ejemplo Este', customer: 'este',
    status: 'progress', assignment: 'Equipo técnico B', date: '18 nov · 11:00',
    report: 'Se verificaron las conexiones. Queda pendiente la prueba con el sistema a plena carga.',
    signature: 'Conformidad pendiente.',
  },
  {
    id: 'DEMO-039', title: 'Sustitución de sonda de retorno', site: 'Nave de ejemplo Sur', customer: 'sur',
    status: 'closed', assignment: 'Equipo técnico A', date: '16 nov · 12:15',
    report: 'Se sustituyó la sonda y se comparó su lectura con el ensayo de referencia. La medición se mantuvo estable.',
    signature: 'Conformidad registrada en la simulación.',
  },
  {
    id: 'DEMO-044', title: 'Comprobación de bomba de circulación', site: 'Taller de ejemplo Oeste', customer: 'norte',
    status: 'review', assignment: 'Equipo técnico C', date: '18 nov · 13:00',
    report: 'Se revisaron ruidos y posibles fugas. El equipo arrancó correctamente en tres pruebas consecutivas.',
    signature: 'Conformidad registrada en la simulación.',
  },
]

const customers = [
  { id: 'norte', name: 'Talleres de Ejemplo', sites: ['Taller de ejemplo Norte', 'Taller de ejemplo Oeste'] },
  { id: 'este', name: 'Comunidad de Ejemplo', sites: ['Edificio de ejemplo Este'] },
  { id: 'sur', name: 'Logística de Ejemplo', sites: ['Nave de ejemplo Sur'] },
]

const quotes = [
  { id: 'PRES-DEMO-014', title: 'Mantenimiento de climatización', customer: 'norte', status: 'sent', lines: [['Revisión trimestral', 4, 18000], ['Filtros de repuesto', 2, 4500]] },
  { id: 'PRES-DEMO-011', title: 'Ajuste del cuadro de ventilación', customer: 'este', status: 'accepted', work: 'DEMO-043', lines: [['Pruebas y ajuste del cuadro', 1, 35000], ['Verificación del caudal', 2, 6000]] },
  { id: 'PRES-DEMO-015', title: 'Revisión anual de sondas', customer: 'sur', status: 'draft', lines: [['Verificación de sondas', 3, 8500]] },
]

const quoteStatuses = {
  sent: { label: 'Enviado', filter: 'Enviados', tone: 'progress' },
  accepted: { label: 'Aceptado', filter: 'Aceptados', tone: 'closed' },
  draft: { label: 'Borrador', filter: 'Borradores', tone: 'neutral' },
}

const views = {
  inicio: ['Inicio', 'Revisa la agenda, los trabajos pendientes y los presupuestos en seguimiento.'],
  trabajos: ['Trabajos', 'Consulta las intervenciones y cierra un trabajo de ejemplo.'],
  clientes: ['Clientes', 'Encuentra las fichas y sus trabajos y presupuestos relacionados.'],
  presupuestos: ['Presupuestos', 'Consulta estados, partidas e importes de ejemplo.'],
}

const statuses = {
  review: {
    label: 'Por cerrar', icon: '!', heading: 'El parte está listo para revisión',
    note: 'Consulta el parte y confirma el cierre cuando hayas revisado el trabajo.',
    report: 'Parte enviado',
  },
  progress: {
    label: 'En curso', icon: '…', heading: 'Hay una intervención en curso',
    note: 'El equipo técnico está completando las comprobaciones. Aquí puedes consultar las notas registradas.',
    report: 'Notas del técnico',
  },
  closed: {
    label: 'Cerrado', icon: '✓', heading: 'Trabajo cerrado',
    note: 'El parte y la conformidad siguen disponibles en la ficha.',
    report: 'Parte archivado',
  },
}

const get = id => document.getElementById(id)
const workspace = get('workspace')
const search = get('search')
const list = get('work-list')
const detail = get('detail')
const detailTitle = get('detail-title')
const closeWork = get('close-work')
const confirmation = get('confirm')
const report = get('report')
const filterButtons = [...document.querySelectorAll('[data-filter]')]
const navLinks = [...document.querySelectorAll('[data-view]')]
const viewTitle = get('view-title')
const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

let jobs
let selectedId
let activeFilter
let mobileDetailOpen
let quoteFilter = 'all'

function normalize(text) {
  return text.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').trim()
}

function findMatches() {
  const tokens = normalize(search.value).split(/\s+/).filter(Boolean)
  return jobs.filter(job => {
    const text = normalize(`${job.title} ${job.site} ${job.id}`)
    return tokens.every(term => text.includes(term))
  })
}

function element(tag, className, content) {
  const node = document.createElement(tag)
  node.className = className
  if (content) node.textContent = content
  return node
}

function link(label, href, className = '') {
  const anchor = element('a', className, label)
  anchor.href = href
  return anchor
}

function money(cents) {
  return currency.format(cents / 100)
}

function amount(quote) {
  return quote.lines.reduce((total, [, quantity, price]) => total + quantity * price, 0)
}

function agendaItem(job) {
  const row = element('li', 'agenda-item')
  row.append(
    element('span', 'agenda-time', job.date.split(' · ')[1]),
    link(job.title, `#trabajos/${job.id}`),
    element('small', '', `${job.site} · ${job.assignment}`),
  )
  return row
}

function pendingItem(job) {
  const row = element('li', 'pending-item')
  row.dataset.status = job.status
  row.append(link(job.title, `#trabajos/${job.id}`), element('small', '', job.site))
  return row
}

function renderHome() {
  const schedule = jobs.filter(job => job.date.startsWith('18 nov'))
  const pending = jobs.filter(job => job.status === 'review')
  const stats = [
    [schedule.length, 'Intervenciones del día', null, 'neutral'],
    [pending.length, 'Trabajos por cerrar', '#trabajos/por-cerrar', 'review'],
    [quotes.filter(quote => quote.status === 'sent').length, 'Presupuestos en seguimiento', '#presupuestos/enviados', 'progress'],
  ]
  get('activity-stats').replaceChildren(...stats.map(([count, label, href, tone]) => {
    const card = href ? link('', href, 'activity-card') : element('div', 'activity-card')
    card.dataset.status = tone
    card.append(element('strong', '', String(count)), element('span', '', label))
    return card
  }))
  get('agenda-list').replaceChildren(...schedule.map(agendaItem))
  get('pending-list').replaceChildren(...(pending.length
    ? pending.map(pendingItem)
    : [element('li', 'empty-message', 'No quedan partes por cerrar en la demo.')]))
}

function recordCard(title, subtitle, label, tone) {
  const record = element('details', 'surface record')
  const summary = element('summary', 'record-summary')
  const text = element('span', 'record-heading')
  const chevron = element('span', 'report-chevron')
  chevron.setAttribute('aria-hidden', 'true')
  text.append(element('strong', '', title), element('small', '', subtitle))
  summary.append(text)
  if (label) {
    record.dataset.status = tone
    summary.append(element('span', 'badge', label))
  }
  summary.append(chevron)
  const content = element('div', 'record-content')
  record.append(summary, content)
  return { record, content }
}

function customerCard(customer) {
  const relatedJobs = jobs.filter(job => job.customer === customer.id)
  const relatedQuotes = quotes.filter(quote => quote.customer === customer.id)
  const siteCount = customer.sites.length
  const { record, content } = recordCard(customer.name, `${siteCount} ${siteCount === 1 ? 'centro' : 'centros'}`)
  content.append(element('h3', '', 'Centros'), element('p', '', customer.sites.join(' · ')))
  content.append(element('h3', '', 'Trabajos relacionados'))
  const workLinks = element('ul', 'related-links')
  for (const job of relatedJobs) {
    const row = document.createElement('li')
    row.append(link(job.title, `#trabajos/${job.id}`))
    workLinks.append(row)
  }
  content.append(workLinks)
  const quoteCount = relatedQuotes.length
  const quoteLabel = quoteCount === 1 ? 'presupuesto relacionado' : 'presupuestos relacionados'
  content.append(link(`Ver ${quoteCount} ${quoteLabel}`, `#presupuestos/${customer.id}`, 'record-link'))
  return record
}

function renderCustomers() {
  const query = normalize(get('customer-search').value)
  const matches = customers.filter(customer => normalize(`${customer.name} ${customer.sites.join(' ')}`).includes(query))
  get('customer-count').textContent = matches.length === 1 ? '1 cliente' : `${matches.length} clientes`
  get('customer-list').replaceChildren(...(matches.length
    ? matches.map(customerCard)
    : [element('p', 'empty-message', 'No hay clientes que coincidan con la búsqueda.')]))
}

function quoteCard(quote) {
  const net = amount(quote)
  const tax = Math.round(net * .21)
  const { label, tone } = quoteStatuses[quote.status]
  const customer = customers.find(item => item.id === quote.customer)
  const total = money(net + tax)
  const { record, content } = recordCard(quote.title, `${quote.id} · ${customer.name}`, label, tone)
  const amounts = element('dl', 'quote-amounts')
  const rows = quote.lines.map(([line, quantity, unit]) => [`${line} · ${quantity} u.`, money(quantity * unit)])
  rows.push(['IVA (21 %)', money(tax)], ['Total', total])
  for (const [name, price] of rows) {
    const row = document.createElement('div')
    row.append(element('dt', '', name), element('dd', '', price))
    amounts.append(row)
  }
  content.append(amounts)
  if (quote.work) content.append(link('Abrir trabajo relacionado', `#trabajos/${quote.work}`, 'record-link'))
  record.querySelector('.record-heading').append(element('span', 'quote-total', total))
  return record
}

function renderQuotes(customerId) {
  const customer = customers.find(item => item.id === customerId)
  const customerQuotes = customer ? quotes.filter(quote => quote.customer === customer.id) : quotes
  const matches = customerQuotes.filter(quote => quoteFilter === 'all' || quoteFilter === quote.status)
  const filters = [['all', 'Todos'], ...Object.entries(quoteStatuses).map(([key, status]) => [key, status.filter])]
  get('quote-filters').replaceChildren(...filters.map(([key, label]) => {
    const filter = element('button', 'filter', label)
    filter.type = 'button'
    filter.dataset.quoteFilter = key
    filter.setAttribute('aria-pressed', String(key === quoteFilter))
    filter.append(element('span', '', String(key === 'all' ? customerQuotes.length : customerQuotes.filter(quote => quote.status === key).length)))
    return filter
  }))
  get('quote-count').textContent = `${matches.length === 1 ? '1 presupuesto' : `${matches.length} presupuestos`}${customer ? ` · ${customer.name}` : ''}`
  get('quote-list').replaceChildren(...(matches.length
    ? matches.map(quoteCard)
    : [element('p', 'empty-message', 'No hay presupuestos en este estado.')]))
  get('all-quotes').hidden = !customer
}

function openView(moveFocus) {
  const [section, record] = location.hash.slice(1).split('/')
  if (section === 'contenido') return
  const view = Object.hasOwn(views, section) ? section : 'inicio'
  const [title, description] = views[view]
  viewTitle.textContent = title
  get('view-description').textContent = description
  get('reset').hidden = view !== 'trabajos'
  document.title = `${title} · Demo de Voltian OS`
  for (const navLink of navLinks) {
    const active = navLink.dataset.view === view
    get(`view-${navLink.dataset.view}`).hidden = !active
    if (active) navLink.setAttribute('aria-current', 'page')
    else navLink.removeAttribute('aria-current')
  }

  if (view === 'inicio') renderHome()
  if (view === 'clientes') renderCustomers()
  if (view === 'presupuestos') {
    quoteFilter = record === 'enviados' ? 'sent' : 'all'
    renderQuotes(record)
  }
  if (view === 'trabajos') {
    mobileDetailOpen = jobs.some(job => job.id === record)
    report.open = false
    if (mobileDetailOpen) selectedId = record
    activeFilter = record === 'por-cerrar' ? 'review' : 'all'
    search.value = ''
    render()
  }

  if (moveFocus) {
    window.scrollTo(0, 0)
    const target = view === 'trabajos' && mobileDetailOpen ? detailTitle : viewTitle
    target.focus({ preventScroll: true })
  }
}

function jobRow(job) {
  const row = document.createElement('li')
  const button = element('button', 'work-button')
  button.type = 'button'
  button.dataset.jobId = job.id
  button.dataset.status = job.status
  button.setAttribute('aria-controls', 'detail')
  if (job.id === selectedId) button.setAttribute('aria-current', 'true')

  const main = element('span', 'work-info')
  main.append(element('strong', '', job.title), element('small', '', job.site))
  const label = element('span', 'badge', statuses[job.status].label)
  const chevron = element('span', 'row-chevron')
  chevron.setAttribute('aria-hidden', 'true')
  button.append(main, label, chevron)
  row.append(button)
  return row
}

function renderDetail(job) {
  detail.hidden = !job
  if (!job) return
  const status = statuses[job.status]
  detail.dataset.status = job.status
  detailTitle.textContent = job.title
  get('detail-id').textContent = job.id
  get('detail-state').textContent = status.label
  get('detail-site').textContent = job.site
  get('detail-assignment').textContent = job.assignment
  get('detail-date').textContent = job.date
  get('focus-icon').textContent = status.icon
  get('action-title').textContent = status.heading
  get('action-copy').textContent = status.note
  get('report-status').textContent = status.report
  get('report-text').textContent = job.report
  get('report-signature').textContent = job.signature
  closeWork.hidden = job.status !== 'review'
}

function render() {
  const matches = findMatches()
  const visibleJobs = matches.filter(job => activeFilter === 'all' || job.status === activeFilter)
  selectedId = visibleJobs.find(job => job.id === selectedId)?.id ?? visibleJobs[0]?.id
  const selected = visibleJobs.find(job => job.id === selectedId)

  for (const button of filterButtons) {
    const filter = button.dataset.filter
    const count = filter === 'all' ? matches.length : matches.filter(job => job.status === filter).length
    button.setAttribute('aria-pressed', String(filter === activeFilter))
    button.querySelector('span').textContent = count
  }

  get('result-count').textContent = visibleJobs.length === 1 ? '1 trabajo' : `${visibleJobs.length} trabajos`
  get('empty').hidden = visibleJobs.length > 0
  list.replaceChildren(...visibleJobs.map(jobRow))
  workspace.classList.toggle('show-detail', mobileDetailOpen && Boolean(selected))
  renderDetail(selected)
}

function showList() {
  if (location.hash.startsWith('#trabajos/')) history.replaceState(null, '', '#trabajos')
  mobileDetailOpen = false
  render()
  const currentRow = [...list.querySelectorAll('[data-job-id]')].find(row => row.dataset.jobId === selectedId)
  const target = currentRow ?? search
  target.focus()
}

function clearFilters() {
  search.value = ''
  activeFilter = 'all'
  report.open = false
  mobileDetailOpen = false
  render()
  search.focus()
}

function resetDemo(announce = false) {
  if (announce && location.hash.startsWith('#trabajos/')) history.replaceState(null, '', '#trabajos')
  jobs = examples.map(job => ({ ...job }))
  selectedId = jobs[0].id
  activeFilter = 'all'
  mobileDetailOpen = false
  search.value = ''
  report.open = false
  render()
  if (announce) get('announcement').textContent = 'Demo reiniciada.'
}

list.addEventListener('click', event => {
  const button = event.target.closest('[data-job-id]')
  if (!button) return
  selectedId = button.dataset.jobId
  mobileDetailOpen = true
  report.open = false
  render()
  detailTitle.focus()
})

for (const button of filterButtons) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter
    report.open = false
    render()
  })
}

search.addEventListener('input', () => {
  report.open = false
  render()
})
get('back').addEventListener('click', showList)
get('clear').addEventListener('click', clearFilters)
get('reset').addEventListener('click', () => resetDemo(true))
get('customer-search').addEventListener('input', renderCustomers)
get('quote-filters').addEventListener('click', event => {
  const button = event.target.closest('[data-quote-filter]')
  if (!button) return
  quoteFilter = button.dataset.quoteFilter
  renderQuotes(location.hash.slice(1).split('/')[1])
  get('quote-filters').querySelector('[aria-pressed="true"]').focus()
})
window.addEventListener('hashchange', () => openView(true))
for (const navLink of navLinks) {
  navLink.addEventListener('click', () => {
    if (navLink.hash === location.hash) openView(true)
  })
}
closeWork.addEventListener('click', () => {
  confirmation.returnValue = 'cancel'
  confirmation.showModal()
})

confirmation.addEventListener('close', () => {
  if (confirmation.returnValue !== 'close') return
  const job = jobs.find(item => item.id === selectedId)
  if (job?.status !== 'review') return

  job.status = 'closed'
  if (activeFilter === 'review') activeFilter = 'all'
  render()
  get('announcement').textContent = `${job.title}. Trabajo cerrado.`
  detailTitle.focus()
})

resetDemo()
openView(false)
