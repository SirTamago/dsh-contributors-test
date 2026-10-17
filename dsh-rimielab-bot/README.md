# dsh-rimielab-bot

把「用 `dsh-rimielab[bot]` 提交」这件事做成一个 DSH 插件。启用后，DSH 的每个会话都会在它所在的 git 仓库里自动完成三件事：

1. **提交身份**：把仓库本地的 `user.name` / `user.email` 设成机器人；
2. **Contributors**：补齐 `.mailmap`，并在 `CONTRIBUTORS.md` 里维护一个同时包含你的账号和机器人的区块；
3. **Devlog**：如果仓库有 GitHub remote 且还没有 devlog 工作流，就放一份自举版 `.github/workflows/devlog.yml`。

插件同时会向模型注入一段提交约定：每次提交都带一行 `Co-authored-by:`，这样 GitHub 的 Contributors 统计会同时记到你的账号和机器人；devlog 里不要写 `@`。

## 安装

在 DSH 里用 Plugin Manager 安装本目录即可（本地目录安装）：

```text
/Users/rimrose/Dev/dsh-contributor-test/dsh-rimielab-bot
```

安装后 bundle 会插入一行插件。插件只影响启用了它的 profile；不需要改任何仓库里的文件，也不需要全局 git config。

## 一个仓库不想被接管

在仓库根目录放一个空文件：

```bash
touch .dsh-keep-identity
```

插件会跳过这个仓库，不设身份、不写 contributors、不装 devlog。

## 配置

在 profile 的 bundle patch 里覆盖（默认值见 `lib/index.js` 的 `DEFAULTS`）：

```yaml
- id: dsh-rimielab-bot
  config:
    enabled: true
    botName: DeepSeek Harness
    botEmail: 342685585+dsh-rimielab[bot]@users.noreply.github.com
    humanName: Rimrose
    humanLogin: SirTamago
    humanEmail: 44104592+SirTamago@users.noreply.github.com
    humanAliasEmail: git@rimrose.work
    autoGitConfig: true
    manageContributors: true
    installDevlogWorkflow: true
    devlogAppId: "5321359"
    devlogSecretName: DSH_APP_PRIVATE_KEY
```

`installDevlogWorkflow: false` 可以只保留身份和 contributors 功能。

## 它具体改什么

| 位置 | 行为 |
| --- | --- |
| `.git/config` 的 `user.name` / `user.email` | 设为机器人；插件卸载时会恢复成之前的值（前提是期间没人再改过） |
| `.mailmap` | 追加两条映射：机器人身份、你的 noreply 邮箱（含 `git@rimrose.work` 别名） |
| `CONTRIBUTORS.md` | 文件不存在则创建；已有且两个邮箱都在则不碰；否则插入带标记的区块 |
| `.github/workflows/devlog.yml` | 仅当仓库有 GitHub remote 且文件不存在时写入，永不覆盖已有工作流 |

自动写入都只在内容确实变化时发生，重复开会话不会产生无意义的 diff。

## Devlog 还需要什么

工作流本身是自举的：标签和 issue 不存在时会自动创建。但它需要仓库里配置 App 私钥：

1. App 设置 → Private keys → Generate a private key，下载 `.pem`；
2. 仓库 Settings → Secrets and variables → Actions → New repository secret；
3. Name 填 `DSH_APP_PRIVATE_KEY`（或你在配置里改的名字），值是 `.pem` 全文。

没配 secret 时工作流只输出 warning，不会失败。App 需要 `Issues: Read and write` 权限，且该仓库要在 App 的安装范围内。

## 边界

- 插件只改**仓库本地** git 身份，不碰你的全局 `~/.gitconfig`。
- GitHub 侧栏的 Contributors 盒子只认提交邮箱；插件通过提交身份 + `Co-authored-by` 让两个账号都进入统计，不依赖 `CONTRIBUTORS.md`。
- 机器人账号没有 hovercard（GitHub 对 Bot 类型的通用行为），这是账号类型决定的，插件无法改变。
- devlog 工作流通过 GitHub Actions 运行；本机插件不会直接调 GitHub API，也不需要把 App 私钥放到本机。
