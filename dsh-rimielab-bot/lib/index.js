/**
 * dsh-rimielab-bot
 *
 * Host-only bundle. When enabled it makes every git repository a session works
 * in use the GitHub App bot identity `dsh-rimielab[bot]`, keeps `.mailmap` and
 * `CONTRIBUTORS.md` in sync for both the bot and the human owner, and installs
 * the self-bootstrapping devlog workflow when the repository is on GitHub.
 *
 * Escape hatch: put `.dsh-keep-identity` in a repository root.
 */

import { execFile } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Stable Cordis plugin name used by Loader diagnostics. */
export const name = 'dsh-rimielab-bot'

/** Services this plugin cannot work without. */
export const inject = ['systemPrompt', 'agents']

/** Defaults; every value can be overridden in the bundle patch config. */
export const DEFAULTS = Object.freeze({
  enabled: true,
  botName: 'DeepSeek Harness',
  botEmail: '342685585+dsh-rimielab[bot]@users.noreply.github.com',
  botLogin: 'dsh-rimielab[bot]',
  botAvatar: 'https://avatars.githubusercontent.com/in/5321359?v=4',
  humanName: 'Rimrose',
  humanLogin: 'SirTamago',
  humanEmail: '44104592+SirTamago@users.noreply.github.com',
  humanAliasEmail: 'git@rimrose.work',
  humanAvatar: 'https://avatars.githubusercontent.com/u/44104592?v=4',
  autoGitConfig: true,
  manageContributors: true,
  installDevlogWorkflow: true,
  devlogAppId: '5321359',
  devlogSecretName: 'DSH_APP_PRIVATE_KEY',
  keepIdentityFile: '.dsh-keep-identity',
})

const CONTRIBUTORS_BEGIN = '<!-- dsh-rimielab-bot:contributors:begin -->'
const CONTRIBUTORS_END = '<!-- dsh-rimielab-bot:contributors:end -->'

/** Coerce YAML/JSON-ish booleans without treating the string "false" as true. */
function asBool(value, fallback) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === 'yes' || normalized === '1') return true
    if (normalized === 'false' || normalized === 'no' || normalized === '0') return false
  }
  return fallback
}

/** Resolve the row config over the defaults. */
export function resolveConfig(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const pick = (key) => (typeof source[key] === 'string' && source[key].length > 0 ? source[key] : DEFAULTS[key])
  return {
    ...DEFAULTS,
    ...Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, pick(key)])),
    enabled: asBool(source.enabled, DEFAULTS.enabled),
    autoGitConfig: asBool(source.autoGitConfig, DEFAULTS.autoGitConfig),
    manageContributors: asBool(source.manageContributors, DEFAULTS.manageContributors),
    installDevlogWorkflow: asBool(source.installDevlogWorkflow, DEFAULTS.installDevlogWorkflow),
  }
}

/** Run a git command in one repository. */
async function git(root, args, options = {}) {
  const { stdout } = await execFileAsync('git', ['-C', root, ...args], {
    timeout: 5000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    ...options,
  })
  return stdout
}

/** Read one repository-local config value, or null when it is unset. */
async function gitGet(root, key) {
  try {
    const value = (await git(root, ['config', '--local', '--get', key])).trim()
    return value.length === 0 ? null : value
  } catch (error) {
    if (error && (error.code === 1 || error.code === '1')) return null
    throw error
  }
}

/** Set one repository-local config value. */
async function gitSet(root, key, value) {
  await git(root, ['config', '--local', key, value])
}

/** Unset one repository-local config value; missing keys are fine. */
async function gitUnset(root, key) {
  try {
    await git(root, ['config', '--local', '--unset', key])
  } catch (error) {
    if (error && (error.code === 1 || error.code === '1' || error.code === 5 || error.code === '5')) return
    throw error
  }
}

/** Find the repository root containing `cwd`, or null outside a work tree. */
export async function findRepoRoot(cwd) {
  if (typeof cwd !== 'string' || cwd.length === 0) return null
  try {
    const root = (await git(cwd, ['rev-parse', '--show-toplevel'])).trim()
    return root.length === 0 ? null : root
  } catch {
    return null
  }
}

/** Return the origin URL, or null when the repository has no origin. */
async function originUrl(root) {
  try {
    return (await git(root, ['remote', 'get-url', 'origin'])).trim()
  } catch {
    return null
  }
}

/** True when the path exists. */
async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

/** Read a UTF-8 file, or return null when it does not exist. */
async function readText(target) {
  try {
    return await readFile(target, 'utf8')
  } catch (error) {
    if (error && error.code === 'ENOENT') return null
    throw error
  }
}

/** Write only when the bytes would change, so repeated sessions are quiet. */
async function writeIfChanged(target, text) {
  const current = await readText(target)
  if (current === text) return false
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, text, 'utf8')
  return true
}

/** Compare a config value while ignoring quoting differences. */
function sameEmail(left, right) {
  return typeof left === 'string' && typeof right === 'string' && left.trim().toLowerCase() === right.trim().toLowerCase()
}

/** Ensure the repository-local identity is the bot, remembering what to restore. */
export async function configureIdentity(root, config) {
  const currentName = await gitGet(root, 'user.name')
  const currentEmail = await gitGet(root, 'user.email')
  if (currentName === config.botName && sameEmail(currentEmail, config.botEmail)) {
    return { changed: false, previous: null }
  }

  const previous = { name: currentName, email: currentEmail }
  await gitSet(root, 'user.name', config.botName)
  await gitSet(root, 'user.email', config.botEmail)
  return { changed: true, previous }
}

/** Append only lines that are not already present in `.mailmap`. */
export async function ensureMailmap(root, config) {
  const target = path.join(root, '.mailmap')
  const current = (await readText(target)) ?? ''
  const wanted = [
    `${config.botName} <${config.botEmail}> <dsh@deepseek-harness.invalid>`,
    `${config.humanName} <${config.humanEmail}> <${config.humanAliasEmail}>`,
  ]

  const present = new Set(
    current
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#')),
  )
  const missing = wanted.filter((line) => !present.has(line))
  if (missing.length === 0) return { changed: false, added: [] }

  const prefix = current.length > 0 && !current.endsWith('\n') ? '\n' : ''
  const next = `${current}${prefix}${missing.join('\n')}\n`
  await writeIfChanged(target, next)
  return { changed: true, added: missing }
}

/** Render the marker block that lists both identities in CONTRIBUTORS.md. */
function contributorsBlock(config) {
  const cell = (value) => String(value).replaceAll('|', '\\|')
  return [
    CONTRIBUTORS_BEGIN,
    '## dsh-rimielab[bot] 贡献者',
    '',
    '本节由 `dsh-rimielab-bot` 插件维护。GitHub 侧栏的 **Contributors** 盒子只统计',
    '能关联到 GitHub 账号的提交邮箱；两个身份都使用 GitHub 官方 noreply 邮箱。',
    '',
    '| 贡献者 | 账号 | 头像 | 提交邮箱 | 角色 |',
    '| --- | --- | --- | --- | --- |',
    `| ${cell(config.botName)} | \`${cell(config.botLogin)}\` | <img src="${config.botAvatar}" width="24" height="24" alt="" /> | \`${cell(config.botEmail)}\` | AI coding agent · 全部机器人提交 |`,
    `| ${cell(config.humanName)} | [@${cell(config.humanLogin)}](https://github.com/${config.humanLogin}) | <img src="${config.humanAvatar}" width="24" height="24" alt="" /> | \`${cell(config.humanEmail)}\` | 仓库所有者 · co-author |`,
    '',
    '机器人提交会在提交信息末尾带一行：',
    '',
    '```text',
    `Co-authored-by: ${config.humanName} <${config.humanEmail}>`,
    '```',
    '',
    '这样人类账号也会计入 GitHub 的贡献者统计，而不需要让出 author 位置。',
    CONTRIBUTORS_END,
  ].join('\n')
}

/** Create or update the marker block without touching the rest of the file. */
export async function ensureContributors(root, config) {
  const target = path.join(root, 'CONTRIBUTORS.md')
  const current = await readText(target)
  const block = contributorsBlock(config)

  if (current === null) {
    const next = `# Contributors\n\n${block}\n`
    await writeFile(target, next, 'utf8')
    return { changed: true, created: true }
  }

  // Already documented both identities: leave hand-written files alone.
  if (current.includes(config.botEmail) && current.includes(config.humanEmail)) {
    return { changed: false, created: false }
  }

  const begin = current.indexOf(CONTRIBUTORS_BEGIN)
  const end = current.indexOf(CONTRIBUTORS_END)
  let next
  if (begin !== -1 && end !== -1 && end > begin) {
    next = `${current.slice(0, begin)}${block}${current.slice(end + CONTRIBUTORS_END.length)}`
  } else {
    const separator = current.endsWith('\n') ? '\n' : '\n\n'
    next = `${current}${separator}${block}\n`
  }
  await writeIfChanged(target, next)
  return { changed: true, created: false }
}

/** Install the self-bootstrapping devlog workflow when the repo is on GitHub. */
export async function ensureDevlogWorkflow(root, config) {
  const remote = await originUrl(root)
  if (!remote || !/github\.com[:/]/iu.test(remote)) {
    return { changed: false, reason: 'no GitHub origin' }
  }

  const target = path.join(root, '.github', 'workflows', 'devlog.yml')
  if (await exists(target)) return { changed: false, reason: 'already present' }

  const templatePath = path.join(PACKAGE_ROOT, 'templates', 'devlog.yml')
  const template = await readFile(templatePath, 'utf8')
  const text = template
    .replaceAll('{{APP_ID}}', config.devlogAppId)
    .replaceAll('{{SECRET_NAME}}', config.devlogSecretName)
    .replaceAll('{{BOT_NAME}}', config.botName)
    .replaceAll('{{BOT_LOGIN}}', config.botLogin)

  await writeIfChanged(target, text)
  return { changed: true, reason: 'installed' }
}

/**
 * Apply all repository-side setup once.
 * Each step is isolated so one failure does not suppress the others.
 */
export async function setupRepository(root, config, log = () => {}) {
  const result = {}
  const step = async (label, run) => {
    try {
      result[label] = await run()
    } catch (error) {
      result[label] = { changed: false, error: error instanceof Error ? error.message : String(error) }
      log(`[dsh-rimielab-bot] ${label} failed for ${root}: ${result[label].error}`)
    }
  }

  if (config.autoGitConfig) await step('identity', () => configureIdentity(root, config))
  if (config.manageContributors) {
    await step('mailmap', () => ensureMailmap(root, config))
    await step('contributors', () => ensureContributors(root, config))
  }
  if (config.installDevlogWorkflow) await step('devlog', () => ensureDevlogWorkflow(root, config))

  return result
}

/** Build the model-facing policy section for the current config. */
export function promptText(config) {
  return [
    '## dsh-rimielab[bot] repository policy',
    '',
    'This profile is configured to commit as the GitHub App bot identity:',
    '',
    `- author/committer: \`${config.botName} <${config.botEmail}>\``,
    `- GitHub account: \`${config.botLogin}\``,
    '',
    'The `dsh-rimielab-bot` plugin sets the repository-local git identity when a session starts,',
    'so a plain `git commit` already uses the bot. Do not override it with a human `-c user.*`',
    'unless the user explicitly asks for that repository.',
    '',
    'Add this trailer to every commit so the human owner also counts in GitHub contributors:',
    '',
    '```text',
    `Co-authored-by: ${config.humanName} <${config.humanEmail}>`,
    '```',
    '',
    `If \`${config.keepIdentityFile}\` exists in a repository root, the plugin is disabled there;`,
    'respect the existing identity and do not add the bot trailer unless asked.',
    '',
    'The plugin also maintains `.mailmap` and a marker block in `CONTRIBUTORS.md` with both',
    'identities. Keep that block intact when editing those files.',
    '',
    'When `.github/workflows/devlog.yml` is present, every push to `main`/`master` is recorded',
    'automatically in the devlog issue; do not create duplicate devlog entries by hand.',
    'Never put `@mentions` in devlog entries.',
  ].join('\n')
}

/** Plugin entry point. */
export function apply(ctx, rawConfig) {
  const config = resolveConfig(rawConfig)
  if (!config.enabled) return

  const previous = new Map()
  const completed = new Set()
  const inFlight = new Map()
  const log = (message) => console.warn(message)

  const setupAt = async (cwd) => {
    const root = await findRepoRoot(cwd)
    if (!root) return
    if (await exists(path.join(root, config.keepIdentityFile))) return
    if (completed.has(root)) return
    if (inFlight.has(root)) return inFlight.get(root)

    const promise = (async () => {
      const result = await setupRepository(root, config, log)
      if (result.identity?.previous) previous.set(root, result.identity.previous)
      completed.add(root)
      return result
    })().finally(() => inFlight.delete(root))
    inFlight.set(root, promise)
    return promise
  }

  const setupAgent = (agent) => {
    let cwd
    try {
      cwd = ctx.get('workingDirectory')?.get(agent?.session)
    } catch {
      cwd = undefined
    }
    return setupAt(cwd ?? agent?.session?.header?.cwd)
  }

  ctx.systemPrompt.section({
    name: 'plugin:dsh-rimielab-bot',
    order: 9000,
    text: promptText(config),
  })

  ctx.on('agent/created', async ({ agent, signal }) => {
    if (signal?.aborted) return
    try {
      await setupAgent(agent)
    } catch (error) {
      log(`[dsh-rimielab-bot] setup failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  })

  // A subagent can start in another directory, and the model can change the
  // session directory mid-conversation; both are committed as this event.
  ctx.on('session/event', (session, event) => {
    if (event?.type !== 'working-directory/change') return
    const cwd = event.data?.cwd
    if (typeof cwd !== 'string' || cwd.length === 0) return
    void setupAt(cwd).catch((error) => {
      log(`[dsh-rimielab-bot] setup failed for ${cwd}: ${error instanceof Error ? error.message : String(error)}`)
    })
  })

  // A plugin can be installed while sessions are already live.
  for (const agent of typeof ctx.agents?.list === 'function' ? ctx.agents.list() : []) {
    void setupAgent(agent).catch((error) => {
      log(`[dsh-rimielab-bot] setup failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  }

  // On disable/unload restore the exact previous local identity, but only when
  // the current value is still the bot (never overwrite a newer user choice).
  ctx.effect(() => () => {
    for (const [root, prior] of previous) {
      void (async () => {
        try {
          const currentName = await gitGet(root, 'user.name')
          const currentEmail = await gitGet(root, 'user.email')
          if (currentName !== config.botName || !sameEmail(currentEmail, config.botEmail)) return
          if (prior.name === null) await gitUnset(root, 'user.name')
          else await gitSet(root, 'user.name', prior.name)
          if (prior.email === null) await gitUnset(root, 'user.email')
          else await gitSet(root, 'user.email', prior.email)
        } catch (error) {
          log(`[dsh-rimielab-bot] restore failed for ${root}: ${error instanceof Error ? error.message : String(error)}`)
        }
      })()
    }
  })
}
