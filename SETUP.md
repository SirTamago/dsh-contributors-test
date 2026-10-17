# 这个仓库是怎么搭起来的

把工作拆成「人做的」和「机器人做的」两部分，方便以后复现。

## 人做的部分

由 [@SirTamago](https://github.com/SirTamago) 完成，这些步骤都需要登录态，无法由程序代办。

### 1. 创建空仓库

- 在 GitHub 上创建 `SirTamago/dsh-contributors-test`
- 不勾选 Add a README / .gitignore / license（保持空仓库，否则首次 push 会冲突）

### 2. 创建 GitHub App（用来提供一个带头像的机器人身份）

Settings → Developer settings → GitHub Apps → New GitHub App：

| 字段 | 值 |
| --- | --- |
| GitHub App name | `dsh-rimielab` |
| Homepage URL | `https://github.com/SirTamago/dsh-contributors-test`（必填，GitHub 不校验内容） |
| Webhook → Active | 取消勾选（否则 Webhook URL 变必填） |
| Repository permissions | **Issues: Read and write**（devlog 需要；只做署名时可以全部 No access） |
| Where can this GitHub App be installed | `Any account`（要装到组织 `RimieLab` 就必须选这个） |
| Display information → Logo | `assets/avatar.png`（DeepSeek 蓝鲸） |

创建后得到 **App ID：`5321359`**（工作流里的 `app-id`），机器人登录名 `dsh-rimielab[bot]`，
bot user ID `342685585`（提交邮箱的前缀）。

只做贡献者署名时，这个 App 不需要安装到仓库，也不需要任何权限；但要用 devlog，
就需要把它安装到目标账号/组织，并授予 Issues 写权限。

### 3. 提供本地工作区与署名方案

## 机器人做的部分

由 `dsh-rimielab[bot]` 完成：仓库脚手架、`README.md` / `CONTRIBUTORS.md` / 本文档、
头像素材整理、历史改写与全部提交。

## 提交身份配置

本仓库现在的**默认 author 是人**（在仓库目录里 `git config` 即可，不会影响其他仓库）：

```bash
git config user.name  "Rimrose"
git config user.email "44104592+SirTamago@users.noreply.github.com"
```

机器人作为 **co-author**，提交信息末尾带一行即可：

```text
Co-authored-by: DeepSeek Harness <342685585+dsh-rimielab[bot]@users.noreply.github.com>
```

这样 author 记到你的账号、co-author 记到机器人，两个账号都会出现在 Contributors 统计里。
历史提交里机器人作为 author 的保持不变，不重写历史。

`dsh-rimielab-bot` 插件启用后会自动设置本地身份并注入这条约定，一般不需要手动执行。

## 复现要点

提交作者邮箱的对应关系：

| 身份 | 提交邮箱 |
| --- | --- |
| 人（author） | `<user id>+<login>@users.noreply.github.com` |
| GitHub App 机器人（co-author） | `<bot user ID>+<app-slug>[bot]@users.noreply.github.com` |

注意：邮箱前缀是 **bot user ID**（本仓库 `342685585`），不是 App ID（`5321359`）。
两种邮箱都是 GitHub 官方保留的 noreply 形式，能直接关联到对应账号，
**不需要**域名验证，也不会泄露真实邮箱。

## 自动工作记录（Devlog）

`.github/workflows/devlog.yml` 会在每次 push 到 `main` 时，追加一条 comment 到
[devlog issue #2](https://github.com/SirTamago/dsh-contributors-test/issues/2)，
作者是 `dsh-rimielab[bot]`。issue 正文只放约定，每次运行自动刷新。

记录里刻意不出现 `@用户名` —— mention 会**重新激活**已经退订的 thread，那是真正会误伤的路径。
普通评论则会通知该 thread 的订阅者，不想收就打开 issue → 右侧栏 → **Unsubscribe**
（每个账号各设一次即可）。

这个工作流是**通用**的，可以直接复制到其他仓库：

- 监听 `main` 和 `master`，也支持在 Actions 页面 `workflow_dispatch` 手动触发一次；
- **自举**：`devlog` 标签和 issue 不存在时会自动创建，正文只在创建时写一次；
- `dsh-rimielab-bot` 插件进入新仓库时会自动补上这个 workflow（已有则不动）；
- 若目标仓库关闭了 Issues，先到 Settings → General → Features 打开。

启用 secret 有两种方式：

**A. 逐仓库**（个人账号）

1. App 设置 → **Private keys** → Generate a private key，下载 `.pem`；
2. 仓库 Settings → Secrets and variables → Actions → **New repository secret**：
   - Name: `DSH_APP_PRIVATE_KEY`
   - Secret: 把 `.pem` 的**全文**粘进去（含 `BEGIN` / `END` 两行）；
3. 删掉本地那份 `.pem`。

**B. 组织级**（例如 `RimieLab`，推荐）

1. App 可见性改成 **Any account**，然后 Install App → `RimieLab` → **All repositories**；
2. 组织 Settings → Secrets and variables → Actions → **New organization secret**：
   `DSH_APP_PRIVATE_KEY`，Repository access 选 **All repositories**；
3. 之后组织下新建的仓库也会自动拿到 secret 和 App 安装范围，不需要逐仓库配置。

未配置该 secret 时，工作流只输出一条 warning，不会失败。

令牌是每次运行现换现用的（1 小时有效，任务结束由 action 自动吊销），
仓库里不保存任何长期凭据 —— 长期凭据只有那个 secret，且只存在于 GitHub 的加密存储里。

> 注：`actions/create-github-app-token` 从 v3 起推荐把 `app-id` 换成 `client-id`
> （App 设置 → About → Client ID）。当前用 `app-id` 仍可运行，只是会打一条弃用警告；
> 想消掉警告，把 workflow 里的 `app-id: "5321359"` 改成 `client-id: "Iv…"` 即可。
