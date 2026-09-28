import assert from 'node:assert/strict'
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let passed = 0
function check(name, run) {
  run()
  passed++
  console.log('PASS:', name)
}

try {
  const dragModel = await server.ssrLoadModule('/src/data/taskDrag.ts')
  const model = await server.ssrLoadModule('/src/state/taskState.ts')
  const { tasks: seed, getTaskProgress } = await server.ssrLoadModule('/src/data/tasks.ts')
  const { buildProjects } = await server.ssrLoadModule('/src/data/projects.ts')
  const { taskReducer, serializeTasks, parseTasks, loadTasks, validateTask, isValidDate } = model
  const draft = { title: '  New checkout test  ', description: '  Test payment failures. ', assignee: 'Kosar', priority: 'high', status: 'todo', dueDate: '2026-10-15' }
  const task = { ...draft, id: 'test-new', projectId: 'e-commerce' }
  const initial = { tasks: seed, deleted: null, message: '' }
  let state = initial

  check('Create preserves other tasks and trims input', () => {
    state = taskReducer(state, { type: 'add', task })
    assert.equal(state.tasks.length, seed.length + 1)
    assert.equal(state.tasks.at(-1).title, 'New checkout test')
    assert.deepEqual(state.tasks.slice(0, -1), seed)
    assert.equal(seed.length, 36)
  })
  check('Edit changes fields without changing ID or project', () => {
    state = taskReducer(state, { type: 'update', id: task.id, draft: { ...draft, title: 'Updated task', priority: 'low', assignee: 'Alex', id: 'wrong', projectId: 'wrong' } })
    const edited = state.tasks.find(item => item.id === task.id)
    assert.equal(edited.title, 'Updated task')
    assert.equal(edited.assignee, 'Alex')
    assert.equal(edited.priority, 'low')
    assert.equal(edited.projectId, 'e-commerce')
  })
  check('Status updates progress and project counts', () => {
    state = taskReducer(state, { type: 'status', id: task.id, status: 'done' })
    const project = buildProjects(state.tasks).find(item => item.id === 'e-commerce')
    assert.equal(project.tasks, 13)
    assert.equal(project.progress, Math.round(10 / 13 * 100))
    assert.equal(state.tasks.find(item => item.id === task.id).status, 'done')
  })
  check('Delete, intervening edit, and undo preserve latest data', () => {
    const before = state.tasks
    state = taskReducer(state, { type: 'delete', id: seed[0].id })
    assert.equal(state.tasks.length, before.length - 1)
    state = taskReducer(state, { type: 'update', id: task.id, draft: { ...draft, title: 'Edit after deletion' } })
    state = taskReducer(state, { type: 'undo' })
    assert.equal(state.tasks[0].id, seed[0].id)
    assert.equal(state.tasks.find(item => item.id === task.id).title, 'Edit after deletion')
    assert.equal(state.deleted, null)
    assert.equal(taskReducer(state, { type: 'undo' }), state)
  })
  check('Persisted edits reload exactly, including empty workspace', () => {
    const raw = serializeTasks(state.tasks)
    assert.deepEqual(loadTasks({ getItem: () => raw }).tasks, state.tasks)
    assert.deepEqual(loadTasks({ getItem: () => serializeTasks([]) }).tasks, [])
    assert.equal(loadTasks({ getItem: () => null }).tasks.length, 36)
    assert.equal(getTaskProgress([]), 0)
  })
  check('Deletion remains deleted after reload', () => {
    const removed = taskReducer(state, { type: 'delete', id: task.id })
    const reloaded = parseTasks(serializeTasks(removed.tasks))
    assert.ok(!reloaded.some(item => item.id === task.id))
  })
  check('Broken storage falls back without permitting overwrite', () => {
    for (const raw of ['bad-json', 'null', '{}', '{"version":2,"tasks":[]}', serializeTasks([{ ...seed[0], dueDate: '2026-02-30' }]), serializeTasks([seed[0], seed[0]]), serializeTasks([{ ...seed[0], projectId: 'unknown' }])]) {
      const snapshot = loadTasks({ getItem: () => raw })
      assert.equal(snapshot.canSave, false)
      assert.ok(snapshot.storageError)
      assert.equal(snapshot.tasks.length, seed.length)
    }
    assert.equal(loadTasks({ getItem: () => { throw new Error('blocked') } }).canSave, false)
  })
  check('Required fields, bounds, dates and invalid transitions are checked', () => {
    assert.ok(validateTask({ ...draft, title: ' ', assignee: ' ', dueDate: '' }).title)
    assert.ok(validateTask({ ...draft, title: 'x'.repeat(121) }).title)
    assert.ok(validateTask({ ...draft, description: 'x'.repeat(2001) }).description)
    assert.ok(validateTask({ ...draft, priority: 'urgent' }).priority)
    assert.ok(validateTask({ ...draft, status: 'invalid' }).status)
    assert.equal(isValidDate('2026-02-30'), false)
    assert.equal(isValidDate('2028-02-29'), true)
    assert.equal(taskReducer(state, { type: 'add', task: { ...task, title: ' ' } }), state)
    assert.equal(taskReducer(state, { type: 'add', task: { ...task, projectId: 'unknown' } }), state)
    assert.equal(taskReducer(state, { type: 'status', id: task.id, status: 'invalid' }), state)
    assert.equal(taskReducer(state, { type: 'delete', id: 'unknown' }), state)
  })

  const { DemoSessionContext } = await server.ssrLoadModule('/src/state/demoSessionContext.ts')
  const sessionModel = await server.ssrLoadModule('/src/data/demoSession.ts')
  const DemoGate = (await server.ssrLoadModule('/src/components/DemoGate.tsx')).default
  const Login = (await server.ssrLoadModule('/src/pages/LoginPage.tsx')).default
  const NotFound = (await server.ssrLoadModule('/src/pages/NotFoundPage.tsx')).default
  const SettingsProvider = (await server.ssrLoadModule('/src/state/SettingsProvider.tsx')).default
  const SettingsPage = (await server.ssrLoadModule('/src/pages/SettingsPage.tsx')).default
  const settingsModel = await server.ssrLoadModule('/src/data/settings.ts')
  const { SettingsContext } = await server.ssrLoadModule('/src/state/settingsContext.ts')
  const ProfileProvider = (await server.ssrLoadModule('/src/state/ProfileProvider.tsx')).default
  const ProfilePage = (await server.ssrLoadModule('/src/pages/ProfilePage.tsx')).default
  const awaitCard = (await server.ssrLoadModule('/src/components/TaskCard.tsx')).default
  const profileModel = await server.ssrLoadModule('/src/data/profile.ts')
  const { ProfileContext } = await server.ssrLoadModule('/src/state/profileContext.ts')
  const h = React.createElement
  const { TaskContext } = await server.ssrLoadModule('/src/state/taskContext.ts')
  const Layout = (await server.ssrLoadModule('/src/components/layout/AppLayout.tsx')).default
  const Dashboard = (await server.ssrLoadModule('/src/pages/DashboardPage.tsx')).default
  const Projects = (await server.ssrLoadModule('/src/pages/ProjectsPage.tsx')).default
  const Details = (await server.ssrLoadModule('/src/pages/ProjectDetailsPage.tsx')).default
  const Reports = (await server.ssrLoadModule('/src/pages/ReportsPage.tsx')).default
  const reportsModel = await server.ssrLoadModule('/src/data/reports.ts')
  const Calendar = (await server.ssrLoadModule('/src/pages/CalendarPage.tsx')).default
  const calendarModel = await server.ssrLoadModule('/src/data/calendar.ts')
  const MyTasks = (await server.ssrLoadModule('/src/pages/MyTasksPage.tsx')).default
  const myTasksModel = await server.ssrLoadModule('/src/data/myTasks.ts')
  const Form = (await server.ssrLoadModule('/src/components/TaskForm.tsx')).default
  function render(path, items = state.tasks, storageError = '', settings = settingsModel.defaultSettings, active = true) {
    return renderToString(
      h(DemoSessionContext.Provider, { value: { active, warning: '', openDemo: () => {}, closeDemo: () => {} } },
        h(SettingsContext.Provider, { value: { settings, storageWarning: '', saveSettings: () => true } },
          h(ProfileProvider, null,
            h(TaskContext.Provider, { value: { tasks: items, projects: buildProjects(items), dispatch: () => {}, message: '', deleted: null, storageError } },
              h(MemoryRouter, { initialEntries: [path] },
                h(Routes, null,
                  h(Route, { element: h(DemoGate, null, h(Layout)) },
                    h(Route, { path: '/', element: h(Dashboard) }),
                    h(Route, { path: '/projects', element: h(Projects) }),
                    h(Route, { path: '/tasks', element: h(MyTasks) }),
                    h(Route, { path: '/calendar', element: h(Calendar) }),
                    h(Route, { path: '/reports', element: h(Reports) }),
                    h(Route, { path: '/profile', element: h(ProfilePage) }),
                    h(Route, { path: '/settings', element: h(SettingsPage) }),
                    h(Route, { path: '/projects/:projectId', element: h(Details) })),
                  h(Route, { path: '/login', element: h(Login) }),
                  h(Route, { path: '*', element: h(NotFound) })
                )
              )
            )
          )
        )
      )
    )
  }
  check('All four project routes render cards and CRUD controls', () => {
    for (const project of buildProjects(state.tasks)) {
      const html = render('/projects/' + project.id)
      assert.equal((html.match(/class="task-card"/g) ?? []).length, project.tasks)
      assert.ok(html.includes('Add task'))
      assert.ok(html.includes('Edit '))
      assert.ok(html.includes('Delete '))
      assert.ok(html.includes('Status of '))
    }
  })
  check('Dashboard and projects render updated shared totals', () => {
    const mine = state.tasks.filter(item => item.assignee === 'Kosar')
    assert.ok(render('/').includes(mine.length + ' assigned tasks:'))
    assert.ok(render('/projects').includes('13<!-- --> tasks'))
    assert.ok(render('/projects/e-commerce').includes('Edit after deletion'))
    assert.ok(render('/', []).includes('0 assigned tasks:'))
  })
  check('Filters, missing projects and no-task states render correctly', () => {
    assert.ok(render('/projects/not-found').includes('Project not found'))
    assert.ok(render('/projects/e-commerce?q=zzzzz').includes('No tasks match'))
    assert.equal((render('/projects/e-commerce?priority=high&q=login').match(/class="task-card"/g) ?? []).length, 1)
    assert.ok(render('/projects/e-commerce', []).includes('This project has no tasks yet'))
    assert.ok(render('/', [], 'Storage is unavailable').includes('role="alert"'))
  })
  check('Create and edit dialogs render existing fields and submit controls', () => {
    const create = renderToString(h(SettingsProvider, null, h(ProfileProvider, null, h(Form, { initialStatus: 'in-progress', onSave: () => {}, onClose: () => {} }))))
    assert.ok(create.includes('Create task'))
    assert.ok(create.includes('value="in-progress" selected'))
    assert.ok(create.includes('type="submit"'))
    const edit = renderToString(h(SettingsProvider, null, h(ProfileProvider, null, h(Form, { task: seed[0], onSave: () => {}, onClose: () => {} }))))
    assert.ok(edit.includes(seed[0].title))
    assert.ok(edit.includes(seed[0].dueDate))
    assert.ok(edit.includes('Save changes'))
  })
  check('My Tasks only displays the current assignee across projects', () => {
    const mine = myTasksModel.getMyTasks(state.tasks)
    const html = render('/tasks')
    assert.equal((html.match(/class="task-card"/g) ?? []).length, mine.length)
    assert.ok(!html.includes('Assigned to Alex'))
    assert.ok(html.includes('/projects/e-commerce'))
    assert.ok(render('/').includes('href="/tasks"'))
  })
  check('Combined My Tasks filters and invalid URL fallbacks', () => {
    const ids = buildProjects(state.tasks).map(project => project.id)
    const filters = myTasksModel.readMyTaskFilters(new URLSearchParams('q=SET&project=e-commerce&status=done&priority=high'), ids)
    const selected = myTasksModel.selectMyTasks(state.tasks, filters)
    assert.equal(selected.length, 1)
    assert.equal(selected[0].title, 'Set up project')
    const invalid = myTasksModel.readMyTaskFilters(new URLSearchParams('status=bad&priority=bad&project=bad&due=bad&sort=bad'), ids)
    assert.equal(invalid.status, 'all')
    assert.equal(invalid.project, 'all')
    assert.equal(invalid.sort, 'deadline')
    assert.equal(myTasksModel.selectMyTasks(state.tasks, invalid).length, myTasksModel.getMyTasks(state.tasks).length)
  })
  check('Today, overdue and upcoming use local dates and exclude completed tasks', () => {
    const today = new Date(2026, 8, 26)
    const fixture = [
      { ...seed[0], id: 'past', status: 'todo', dueDate: '2026-09-25' },
      { ...seed[0], id: 'today', status: 'in-progress', dueDate: '2026-09-26' },
      { ...seed[0], id: 'future', status: 'todo', dueDate: '2026-09-27' },
      { ...seed[0], id: 'finished', status: 'done', dueDate: '2026-09-26' },
    ]
    for (const [due, expected] of [['overdue', 'past'], ['today', 'today'], ['upcoming', 'future']]) {
      const filters = myTasksModel.readMyTaskFilters(new URLSearchParams({ due }), ['e-commerce'])
      assert.deepEqual(myTasksModel.selectMyTasks(fixture, filters, today).map(task => task.id), [expected])
    }
  })
  check('My Tasks sorting leaves the shared data order intact', () => {
    const before = state.tasks.map(task => task.id)
    const filters = myTasksModel.readMyTaskFilters(new URLSearchParams('sort=priority'), ['e-commerce'])
    const sorted = myTasksModel.selectMyTasks(state.tasks, filters)
    const ranks = { high: 0, medium: 1, low: 2 }
    assert.ok(sorted.every((task, index) => index === 0 || ranks[sorted[index - 1].priority] <= ranks[task.priority]))
    assert.deepEqual(state.tasks.map(task => task.id), before)
    const named = myTasksModel.selectMyTasks(state.tasks, { ...filters, sort: 'title' })
    assert.ok(named.every((task, index) => index === 0 || named[index - 1].title.localeCompare(task.title) <= 0))
  })
  check('My Tasks reflects mutations, empty results and an empty workspace', () => {
    const active = myTasksModel.getMyTasks(state.tasks).find(task => task.status !== 'done')
    const changed = taskReducer(state, { type: 'status', id: active.id, status: 'done' })
    const filters = myTasksModel.readMyTaskFilters(new URLSearchParams('status=done'), [])
    assert.ok(myTasksModel.selectMyTasks(changed.tasks, filters).some(task => task.id === active.id))
    const reassigned = taskReducer(changed, { type: 'update', id: active.id, draft: { ...active, assignee: 'Alex' } })
    assert.ok(!myTasksModel.getMyTasks(reassigned.tasks).some(task => task.id === active.id))
    assert.ok(render('/tasks?q=zzzzzz').includes('No matching tasks'))
    assert.ok(render('/tasks', []).includes('No tasks assigned to you yet'))
    assert.equal((render('/tasks?project=e-commerce&status=done&priority=high&q=set').match(/class="task-card"/g) ?? []).length, 1)
  })
  check('Calendar month navigation clamps days and crosses year boundaries', () => {
    const { shiftCalendarMonth, readCalendarDate, localDateKey, calendarDays } = calendarModel
    assert.equal(localDateKey(shiftCalendarMonth(readCalendarDate('2026-01-31'), 1)), '2026-02-28')
    assert.equal(localDateKey(shiftCalendarMonth(readCalendarDate('2028-01-31'), 1)), '2028-02-29')
    assert.equal(localDateKey(shiftCalendarMonth(readCalendarDate('2026-12-31'), 1)), '2027-01-31')
    assert.equal(localDateKey(shiftCalendarMonth(readCalendarDate('2026-01-15'), -1)), '2025-12-15')
    assert.equal(localDateKey(shiftCalendarMonth(readCalendarDate('0001-01-31'), 1)), '0001-02-28')
    const days = calendarDays(readCalendarDate('2028-02-10'))
    assert.equal(days.length, 42)
    assert.equal(days[0].getDay(), 1)
    assert.equal(new Set(days.map(localDateKey)).size, 42)
    assert.equal(days.filter(date => date.getMonth() === 1).length, 29)
    assert.equal(localDateKey(readCalendarDate('2026-02-30', new Date(2026, 8, 26))), '2026-09-26')
  })
  check('Calendar filters combine project, owner and completion without mutation', () => {
    const before = state.tasks.map(task => task.id)
    const mine = calendarModel.calendarTasks(state.tasks, 'e-commerce', true, false)
    assert.ok(mine.length > 0)
    assert.ok(mine.every(task => task.projectId === 'e-commerce' && task.assignee === 'Kosar' && task.status !== 'done'))
    assert.equal(calendarModel.calendarTasks(state.tasks, 'all', false, true).length, state.tasks.length)
    assert.deepEqual(calendarModel.calendarTasks([], 'all', true, false), [])
    assert.deepEqual(state.tasks.map(task => task.id), before)
  })
  check('Calendar routes render days, selected agenda and shared controls', () => {
    const task = state.tasks.find(task => task.status !== 'done')
    const path = '/calendar?date=' + task.dueDate
    const html = render(path)
    const expected = state.tasks.filter(item => item.status !== 'done' && item.dueDate === task.dueDate).length
    assert.equal((html.match(/class="task-card"/g) ?? []).length, expected)
    assert.equal((html.match(/class="calendar-day[ "]/g) ?? []).length, 42)
    assert.ok(html.includes(task.title))
    assert.ok(html.includes('Previous month'))
    assert.ok(html.includes('Next month'))
    assert.ok(html.includes('aria-pressed="true"'))
    assert.ok(render('/').includes('href="/calendar"'))
    assert.ok(render('/calendar?date=2026-02-30', []).includes('No tasks due on this day'))
  })
  check('Calendar counts update after deadline changes, completion and deletion', () => {
    const task = state.tasks[0]
    const changed = taskReducer(state, { type: 'update', id: task.id, draft: { ...task, status: 'todo', dueDate: '2030-05-19' } })
    const path = '/calendar?date=2030-05-19'
    assert.ok(render(path, changed.tasks).includes(task.title))
    const done = taskReducer(changed, { type: 'status', id: task.id, status: 'done' })
    assert.ok(render(path, done.tasks).includes('No tasks due on this day'))
    assert.ok(render(path + '&completed=yes', done.tasks).includes(task.title))
    const deleted = taskReducer(done, { type: 'delete', id: task.id })
    assert.ok(render(path + '&completed=yes', deleted.tasks).includes('No tasks due on this day'))
  })
  check('Report aggregates and project totals follow the same filters', () => {
    const projects = buildProjects(state.tasks)
    const report = reportsModel.buildReport(state.tasks, projects)
    assert.equal(report.total, state.tasks.length)
    assert.equal(report.statuses.reduce((sum, item) => sum + item.count, 0), report.total)
    assert.equal(report.priorities.reduce((sum, item) => sum + item.count, 0), report.total)
    assert.equal(report.projects.reduce((sum, item) => sum + item.total, 0), report.total)
    assert.equal(report.open + report.completed, report.total)
    const filtered = reportsModel.buildReport(state.tasks, projects, 'e-commerce', true)
    assert.ok(filtered.items.every(task => task.projectId === 'e-commerce' && task.assignee === 'Kosar'))
    assert.equal(filtered.projects.length, 1)
    assert.equal(filtered.projects[0].total, filtered.total)
    assert.equal(filtered.projects[0].completionRate, filtered.completionRate)
  })
  check('Report overdue counts exclude completed and due-today tasks', () => {
    const tasks = [
      { ...seed[0], id: 'old', status: 'todo', dueDate: '2026-09-24' },
      { ...seed[0], id: 'recent', status: 'in-progress', dueDate: '2026-09-25' },
      { ...seed[0], id: 'today', status: 'todo', dueDate: '2026-09-26' },
      { ...seed[0], id: 'done', status: 'done', dueDate: '2026-09-23' },
    ]
    const report = reportsModel.buildReport(tasks, buildProjects(tasks), 'all', false, new Date(2026, 8, 26))
    assert.deepEqual(report.overdue.map(task => task.id), ['old', 'recent'])
    assert.equal(report.completionRate, 25)
    const empty = reportsModel.buildReport([], buildProjects([]))
    assert.equal(empty.completionRate, 0)
    assert.ok(empty.projects.every(project => project.completionRate === 0))
  })
  check('CSV quotes text, protects formula cells, and exports only supplied tasks', () => {
    const fixture = { ...seed[0], title: 'A, "quoted" task', description: 'line one\nline two', assignee: '=1+1' }
    const csv = reportsModel.reportCsv([fixture], buildProjects(seed))
    assert.ok(csv.startsWith('\uFEFF'))
    assert.ok(csv.includes('"A, ""quoted"" task"'))
    assert.ok(csv.includes('"line one\nline two"'))
    assert.ok(csv.includes("'="))
    assert.ok(!csv.includes(seed[1].title))
    assert.ok(reportsModel.reportCsv([{ ...fixture, title: 'سلام' }], buildProjects(seed)).includes('سلام'))
    assert.equal(reportsModel.reportCsv([], []).split('\r\n').length, 2)
  })
  check('Reports route renders filtered data and disables empty exports', () => {
    const html = render('/reports')
    assert.ok(html.includes('Project completion'))
    assert.ok(html.includes('Export CSV'))
    assert.ok(html.includes('Needs attention'))
    assert.ok(render('/reports?project=e-commerce&owner=me').includes('Assigned to me'))
    assert.ok(render('/reports?project=invalid').includes('All assignees'))
    const empty = render('/reports', [])
    assert.ok(empty.includes('No tasks to report'))
    assert.match(empty, /<button[^>]*disabled[^>]*>Export CSV/)
    assert.ok(render('/').includes('href="/reports"'))
  })
  check('Profile validation accepts optional email and checks field limits', () => {
    const { defaultProfile, validateProfile, cleanProfile, profileInitials } = profileModel
    assert.deepEqual(validateProfile(defaultProfile), {})
    assert.ok(validateProfile({ ...defaultProfile, displayName: ' ' }).displayName)
    assert.ok(validateProfile({ ...defaultProfile, email: 'invalid' }).email)
    assert.ok(validateProfile({ ...defaultProfile, bio: 'a'.repeat(501) }).bio)
    assert.ok(validateProfile({ ...defaultProfile, avatarColor: 'unknown' }).avatarColor)
    assert.equal(cleanProfile({ ...defaultProfile, displayName: '  Sara  ' }).displayName, 'Sara')
    assert.equal(profileInitials('Sara Smith'), 'SS')
    assert.equal(profileInitials('کوثر احمدی'), 'کا')
  })
  check('Profile storage round trip and corrupt snapshots', () => {
    const { defaultProfile, serializeProfile, parseProfile } = profileModel
    const saved = { ...defaultProfile, displayName: 'Sara', email: 'sara@example.com', avatarColor: 'green' }
    assert.deepEqual(parseProfile(serializeProfile(saved)), saved)
    for (const raw of ['null', 'broken', '{}', '{"version":2,"profile":{}}']) assert.throws(() => parseProfile(raw))
    assert.throws(() => parseProfile(JSON.stringify({ version: 1, profile: { ...saved, displayName: '' } })))
  })
  check('Profile route renders editing, preview and personal statistics', () => {
    const html = render('/profile')
    assert.ok(html.includes('Personal details'))
    assert.ok(html.includes('Save profile'))
    assert.ok(html.includes('Cancel changes'))
    assert.ok(html.includes('About you'))
    assert.ok(html.includes('purple avatar'))
  })
  check('Display-name changes preserve task ownership and update visible assignees', () => {
    const task = seed.find(task => task.assignee === 'Kosar')
    const before = myTasksModel.getMyTasks(seed).length
    const Card = (awaitCard)
    const profile = { ...profileModel.defaultProfile, displayName: 'Sara' }
    const html = renderToString(h(ProfileContext.Provider, { value: { profile, storageWarning: '', saveProfile: () => true } },
      h(Card, { task, onEdit: () => {}, onDelete: () => {}, onStatusChange: () => {} })))
    assert.ok(html.includes('Sara'))
    assert.equal(myTasksModel.getMyTasks(seed).length, before)
    assert.equal(task.assignee, 'Kosar')
  })
  check('Settings validate and persist with safe corrupt-data fallbacks', () => {
    const { defaultSettings, isSettings, parseSettings, serializeSettings, loadSettings } = settingsModel
    const custom = { ...defaultSettings, defaultPriority: 'high', weekStartsOn: 6, showCompleted: true, compactCards: true }
    assert.deepEqual(parseSettings(serializeSettings(custom)), custom)
    assert.deepEqual(loadSettings({ getItem: () => null }).settings, defaultSettings)
    assert.equal(isSettings({ ...custom, weekStartsOn: '6' }), false)
    assert.equal(isSettings({ ...custom, defaultPriority: 'urgent' }), false)
    assert.equal(isSettings({ ...custom, compactCards: 'false' }), false)
    for (const raw of ['bad', 'null', '{}', '{"version":2,"settings":{}}']) {
      const loaded = loadSettings({ getItem: () => raw })
      assert.equal(loaded.canSave, false)
      assert.ok(loaded.warning)
    }
    assert.equal(loadSettings({ getItem: () => { throw new Error('blocked') } }).canSave, false)
  })
  check('Week starts support Saturday, Sunday and Monday without missing days', () => {
    for (const start of [6, 0, 1]) {
      const days = calendarModel.calendarDays(calendarModel.readCalendarDate('2028-02-15'), start)
      assert.equal(days[0].getDay(), start)
      assert.equal(days.length, 42)
      assert.equal(days.filter(day => day.getMonth() === 1).length, 29)
    }
  })
  check('Explicit calendar filters override saved completed-task defaults', () => {
    const settings = { ...settingsModel.defaultSettings, showCompleted: true, weekStartsOn: 6 }
    assert.equal(settingsModel.calendarCompletionFilter(null, settings), true)
    assert.equal(settingsModel.calendarCompletionFilter('no', settings), false)
    assert.equal(settingsModel.calendarCompletionFilter('yes', settingsModel.defaultSettings), true)
    const task = state.tasks.find(task => task.status === 'done')
    const path = '/calendar?date=' + task.dueDate
    const all = render(path, state.tasks, '', settings)
    const hidden = render(path + '&completed=no', state.tasks, '', settings)
    assert.ok((all.match(/class="task-card"/g) ?? []).length > (hidden.match(/class="task-card"/g) ?? []).length)
    assert.ok(all.includes('aria-hidden="true"><span>Sat</span>'))
  })
  check('Default priority only applies to new tasks', () => {
    const settings = { ...settingsModel.defaultSettings, defaultPriority: 'low' }
    function form(task) {
      return renderToString(h(SettingsContext.Provider, { value: { settings, storageWarning: '', saveSettings: () => true } },
        h(ProfileProvider, null, h(Form, { task, onSave: () => {}, onClose: () => {} }))))
    }
    assert.ok(form().includes('value="low" selected'))
    assert.ok(form(seed[0]).includes('value="high" selected'))
    assert.equal(seed[0].priority, 'high')
  })
  check('Settings route and compact layout reflect preferences', () => {
    const html = render('/settings')
    assert.ok(html.includes('Save settings'))
    assert.ok(html.includes('Restore defaults'))
    assert.ok(html.includes('Cancel changes'))
    assert.ok(html.includes('Start week on'))
    assert.ok(render('/tasks', state.tasks, '', { ...settingsModel.defaultSettings, compactCards: true }).includes('workspace workspace--compact'))
    assert.ok(!render('/tasks').includes('workspace workspace--compact'))
  })
  check('Demo session is tab-scoped and leaving preserves saved work', () => {
    const values = new Map([['taskora.tasks.v1', 'keep-tasks'], ['taskora.profile.v1', 'keep-profile']])
    const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
    assert.equal(sessionModel.readDemoSession(storage).active, false)
    assert.equal(sessionModel.writeDemoSession(storage, true), '')
    assert.equal(sessionModel.readDemoSession(storage).active, true)
    assert.equal(sessionModel.writeDemoSession(storage, false), '')
    assert.equal(sessionModel.readDemoSession(storage).active, false)
    assert.equal(values.get('taskora.tasks.v1'), 'keep-tasks')
    assert.equal(values.get('taskora.profile.v1'), 'keep-profile')
  })
  check('Unavailable session storage fails gracefully', () => {
    const broken = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
    assert.equal(sessionModel.readDemoSession(broken).active, false)
    assert.ok(sessionModel.readDemoSession(broken).warning)
    assert.ok(sessionModel.writeDemoSession(broken, true))
    assert.ok(sessionModel.writeDemoSession(broken, false))
  })
  check('Return destinations are limited to internal workspace routes', () => {
    const { safeReturnTo } = sessionModel
    assert.equal(safeReturnTo('/projects/e-commerce?q=login#tasks'), '/projects/e-commerce?q=login#tasks')
    assert.equal(safeReturnTo('/calendar?date=2026-09-26'), '/calendar?date=2026-09-26')
    for (const url of [null, '', '//evil.example', 'https://evil.example', '/login?next=/login', '/not-found', '/%2f%2fevil.example', '/' + String.fromCharCode(92) + 'evil.example', '/tasks' + String.fromCharCode(10)]) {
      assert.equal(safeReturnTo(url), '/')
    }
  })
  check('Entry pages clearly label the demo and gate closed sessions', () => {
    const closed = render('/login?next=/tasks', state.tasks, '', settingsModel.defaultSettings, false)
    assert.ok(closed.includes('LOCAL DEMO'))
    assert.ok(closed.includes('Open demo workspace'))
    assert.ok(closed.includes('does not provide authentication'))
    assert.ok(!closed.includes('type="password"'))
    assert.ok(render('/login').includes('Continue to workspace'))
    assert.ok(render('/').includes('Leave demo'))
    assert.equal(render('/tasks', state.tasks, '', settingsModel.defaultSettings, false), '')
  })
  check('404 offers a useful destination for both session states', () => {
    assert.ok(render('/unknown').includes('Page not found'))
    assert.ok(render('/unknown').includes('Back to dashboard'))
    const closed = render('/unknown', state.tasks, '', settingsModel.defaultSettings, false)
    assert.ok(closed.includes('href="/login"'))
    assert.ok(closed.includes('Open Taskora'))
  })
  check('Task drops accept only an existing task in the current project and a new status', () => {
    const { taskDragPayload, resolveTaskDrop } = dragModel
    const task = seed[0]
    const raw = taskDragPayload(task)
    assert.equal(resolveTaskDrop(raw, task.projectId, 'todo', seed), task)
    assert.equal(resolveTaskDrop(raw, task.projectId, task.status, seed), null)
    assert.equal(resolveTaskDrop(raw, 'mobile-app', 'todo', seed), null)
    assert.equal(resolveTaskDrop(raw, task.projectId, 'invalid', seed), null)
    assert.equal(resolveTaskDrop(raw, task.projectId, 'todo', []), null)
    for (const bad of ['text', 'null', '{}', '[]', JSON.stringify({ version: 2, id: task.id, projectId: task.projectId }), JSON.stringify({ version: 1, id: 'missing', projectId: task.projectId })]) {
      assert.equal(resolveTaskDrop(bad, task.projectId, 'todo', seed), null)
    }
  })
  check('Accepted drop updates only status, project metrics and persisted state', () => {
    const task = seed.find(item => item.status === 'todo')
    const accepted = dragModel.resolveTaskDrop(dragModel.taskDragPayload(task), task.projectId, 'done', seed)
    const before = buildProjects(seed).find(project => project.id === task.projectId)
    const moved = taskReducer(initial, { type: 'status', id: accepted.id, status: 'done' })
    assert.deepEqual(moved.tasks.find(item => item.id === task.id), { ...task, status: 'done' })
    assert.deepEqual(moved.tasks.filter(item => item.id !== task.id), seed.filter(item => item.id !== task.id))
    const after = buildProjects(moved.tasks).find(project => project.id === task.projectId)
    assert.equal(after.tasks, before.tasks)
    assert.ok(after.progress > before.progress)
    assert.equal(parseTasks(serializeTasks(moved.tasks)).find(item => item.id === task.id).status, 'done')
  })
  check('Project boards offer draggable cards with accessible status controls', () => {
    const html = render('/projects/e-commerce')
    const count = state.tasks.filter(task => task.projectId === 'e-commerce').length
    assert.equal((html.match(/draggable="true"/g) ?? []).length, count)
    assert.ok(html.includes('board-move-help'))
    assert.ok(html.includes('Status menu on mobile and with a keyboard'))
    assert.ok(html.includes('Status of '))
    assert.ok(!render('/tasks').includes('draggable="true"'))
  })

  const backupModel = await server.ssrLoadModule('/src/data/taskBackup.ts')
  check('Backup round trip preserves Unicode, multiline text and accepts BOM', () => {
    const tasks = [{ ...seed[0], title: 'وظیفه آزمایشی', description: 'First line\n"Second" line' }]
    const raw = backupModel.createTaskBackup(tasks)
    assert.deepEqual(backupModel.readTaskBackup(raw), tasks)
    assert.deepEqual(backupModel.readTaskBackup('\uFEFF' + raw), tasks)
    assert.deepEqual(backupModel.summarizeTaskBackup(tasks), { total: 1, projects: 1, completed: tasks[0].status === 'done' ? 1 : 0, open: tasks[0].status === 'done' ? 0 : 1 })
  })
  check('Backup rejects malformed data, duplicate IDs and unknown projects', () => {
    const bad = ['null', '{', JSON.stringify({ version: 2, tasks: [] }),
      serializeTasks([seed[0], seed[0]]),
      serializeTasks([{ ...seed[0], projectId: 'missing' }]),
      serializeTasks([{ ...seed[0], dueDate: '2026-02-30' }]),
      serializeTasks([{ ...seed[0], status: 'missing' }])]
    for (const raw of bad) assert.throws(() => backupModel.readTaskBackup(raw), /not a valid/)
  })
  check('Backup size limit counts UTF-8 bytes on import and export', () => {
    const large = 'آ'.repeat(backupModel.MAX_BACKUP_BYTES / 2 + 1)
    assert.throws(() => backupModel.readTaskBackup(large), /too large/)
    assert.throws(() => backupModel.createTaskBackup([{ ...seed[0], description: large }]), /too large/)
  })
  check('Replacement is atomic, clears stale undo and persists valid tasks', () => {
    const deleted = taskReducer(initial, { type: 'delete', id: seed[0].id })
    const imported = [seed[1]]
    const result = taskReducer(deleted, { type: 'replace', tasks: imported })
    assert.deepEqual(result.tasks, imported)
    assert.notEqual(result.tasks[0], imported[0])
    assert.equal(result.deleted, null)
    assert.equal(taskReducer(result, { type: 'undo' }), result)
    assert.deepEqual(parseTasks(serializeTasks(result.tasks)), imported)
    assert.equal(taskReducer(deleted, { type: 'replace', tasks: [seed[0], seed[0]] }), deleted)
    assert.equal(initial.tasks.length, 36)
  })
  check('Empty backups clear tasks and Settings starts without replacement controls', () => {
    const tasks = backupModel.readTaskBackup(backupModel.createTaskBackup([]))
    assert.deepEqual(backupModel.summarizeTaskBackup(tasks), { total: 0, projects: 0, completed: 0, open: 0 })
    const empty = taskReducer(initial, { type: 'replace', tasks })
    assert.equal(empty.tasks.length, 0)
    assert.ok(buildProjects(empty.tasks).every(project => project.tasks === 0 && project.progress === 0))
    const html = render('/settings')
    assert.ok(html.includes('Download task backup'))
    assert.ok(html.includes('type="file"'))
    assert.ok(html.includes('Selecting a file does not change your tasks'))
    assert.ok(!html.includes('Replace all tasks'))
  })

  check('My Tasks provides creation even with no tasks or no search results', () => {
    for (const html of [render('/tasks'), render('/tasks', []), render('/tasks?q=unmatched-task-xyz')]) {
      assert.ok(html.includes('Add task'))
    }
  })
  check('Cross-project creation form lists projects and preselects the current filter', () => {
    const projects = buildProjects(seed)
    function form(props) {
      return renderToString(h(SettingsContext.Provider, { value: { settings: settingsModel.defaultSettings, storageWarning: '', saveSettings: () => true } },
        h(ProfileProvider, null, h(Form, { ...props, onSave: () => {}, onClose: () => {} }))))
    }
    const html = form({ projects, initialProjectId: 'mobile-app' })
    assert.ok(html.includes('Choose a project'))
    assert.ok(html.includes('value="mobile-app" selected'))
    for (const project of projects) assert.ok(html.includes(project.name))
    assert.ok(!form({ task: seed[0] }).includes('Choose a project'))
  })
  check('New personal task appears across pages and survives storage reload', () => {
    const created = { ...seed[0], id: 'task19-created', title: 'Task 19 personal task', projectId: 'mobile-app', assignee: 'Kosar', status: 'todo' }
    const result = taskReducer(initial, { type: 'add', task: created })
    assert.ok(render('/tasks', result.tasks).includes(created.title))
    assert.ok(render('/projects/mobile-app', result.tasks).includes(created.title))
    assert.deepEqual(parseTasks(serializeTasks(result.tasks)).find(task => task.id === created.id), created)
    const other = { ...created, id: 'task19-other', title: 'Task 19 delegated task', assignee: 'Alex' }
    const delegated = taskReducer(result, { type: 'add', task: other })
    assert.ok(!render('/tasks', delegated.tasks).includes(other.title))
    assert.ok(render('/projects/mobile-app', delegated.tasks).includes(other.title))
  })
  console.log(`${passed} task checks passed.`)
} finally {
  await server.close()
}
