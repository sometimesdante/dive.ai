import { describe, expect, it } from 'vitest'
import { buildProjectStats, nextProjectCode, projectInitials, sortProjects } from './projects'

describe('projectInitials', () => {
  it('takes the upper-cased first letter of each word', () => {
    expect(projectInitials('Database migration tool')).toBe('DMT')
  })

  it('ignores extra whitespace', () => {
    expect(projectInitials('  brand   identity ')).toBe('BI')
  })
})

describe('nextProjectCode', () => {
  it('starts at 001', () => {
    expect(nextProjectCode('DMT', [])).toBe('DMT-001')
  })

  it('continues from the highest existing number', () => {
    expect(nextProjectCode('DMT', ['DMT-002', 'DMT-009', 'DMT-003'])).toBe('DMT-010')
  })

  it('ignores codes without a number after the prefix', () => {
    expect(nextProjectCode('DMT', ['DMT-new'])).toBe('DMT-001')
  })
})

describe('sortProjects', () => {
  const project = (id: string, name: string, code: string, planned_end: string | null) =>
    ({ id, name, code, planned_end })

  const projects = [
    project('1', 'Mobile layouts', 'NVT-002', '2026-04-01'),
    project('2', 'API gateway',    'NVT-001', null),
    project('3', 'Brand refresh',  'EDC-001', '2026-02-15'),
  ]
  const stats = {
    '1': { total: 10, done: 2, members: [] },
    '2': { total: 4,  done: 4, members: [] },
    // project 3 has no stats yet
  }

  const ids = (sort: Parameters<typeof sortProjects>[2], search = '') =>
    sortProjects(projects, stats, sort, search).map(p => p.id)

  it('sorts alphabetically', () => {
    expect(ids('alphabetical')).toEqual(['2', '3', '1'])
  })

  it('sorts by most tasks first, treating missing stats as zero', () => {
    expect(ids('tasks')).toEqual(['1', '2', '3'])
  })

  it('sorts by nearest deadline, projects without one last', () => {
    expect(ids('deadline')).toEqual(['3', '1', '2'])
  })

  it('sorts by highest completion rate first', () => {
    expect(ids('progress')).toEqual(['2', '1', '3'])
  })

  it('filters by name or code before sorting', () => {
    expect(ids('alphabetical', 'nvt')).toEqual(['2', '1'])
    expect(ids('alphabetical', 'BRAND')).toEqual(['3'])
  })

  it('does not mutate the input', () => {
    const copy = [...projects]
    sortProjects(projects, stats, 'deadline', '')
    expect(projects).toEqual(copy)
  })
})

describe('buildProjectStats', () => {
  const alice = { id: 'u1', name: 'Alice', email: 'alice@example.com' }

  it('counts total and done tasks per project', () => {
    const stats = buildProjectStats(
      [{ id: 'p1' }, { id: 'p2' }],
      [
        { project_id: 'p1', stage: 'done' },
        { project_id: 'p1', stage: 'doing' },
        { project_id: 'p1', stage: 'done' },
      ],
      [],
    )
    expect(stats.p1).toMatchObject({ total: 3, done: 2 })
    expect(stats.p2).toMatchObject({ total: 0, done: 0 })
  })

  it('collects members and skips rows without a profile', () => {
    const stats = buildProjectStats(
      [{ id: 'p1' }],
      [],
      [
        { project_id: 'p1', profiles: alice },
        { project_id: 'p1', profiles: null },
      ],
    )
    expect(stats.p1.members).toEqual([alice])
  })

  it('ignores tasks and members of projects not in the list', () => {
    const stats = buildProjectStats(
      [{ id: 'p1' }],
      [{ project_id: 'other', stage: 'done' }],
      [{ project_id: 'other', profiles: alice }],
    )
    expect(Object.keys(stats)).toEqual(['p1'])
    expect(stats.p1).toEqual({ total: 0, done: 0, members: [] })
  })
})
