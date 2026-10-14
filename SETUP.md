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
| Repository permissions | 全部 No access（这个身份只用于署名，不需要任何权限） |
| Where can this GitHub App be installed | Only on this account |
| Display information → Logo | `assets/avatar.png`（DeepSeek 蓝鲸） |

创建后得到的 **App ID：`342685585`**，机器人登录名：`dsh-rimielab[bot]`。

这个 App **不需要安装到仓库**，也不需要任何权限 —— 署名只看提交邮箱。

### 3. 提供本地工作区与署名方案

## 机器人做的部分

由 `dsh-rimielab[bot]` 完成：仓库脚手架、`README.md` / `CONTRIBUTORS.md` / 本文档、
头像素材整理、历史改写与全部提交。

## 提交身份配置

本仓库的**默认**提交身份是人（在仓库目录里 `git config` 即可，不会影响其他仓库）：

```bash
git config user.name  "Rimrose"
git config user.email "44104592+SirTamago@users.noreply.github.com"
```

要以机器人身份提交时，用 `-c` 临时覆盖，不要在仓库里全局改成机器人：

```bash
git -c user.name="DeepSeek Harness" \
    -c user.email="342685585+dsh-rimielab[bot]@users.noreply.github.com" \
    commit -m "..."
```

（本文档所在的那次提交就是这么产生的。）

## 复现要点

提交作者邮箱的对应关系：

| 身份 | 提交邮箱 |
| --- | --- |
| 人 | `<user id>+<login>@users.noreply.github.com` |
| GitHub App 机器人 | `<App ID>+<app-slug>[bot]@users.noreply.github.com` |

两种邮箱都是 GitHub 官方保留的 noreply 形式，能直接关联到对应账号，
**不需要**域名验证，也不会泄露真实邮箱。
