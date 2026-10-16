# dsh-contributors-test

一个用来验证「非人类贡献者」能否在 Git 仓库里被正确署名、并出现在 GitHub 原生贡献者列表里的实验仓库。

仓库由 **DeepSeek Harness (DSH)** 初始化并提交。

---

## 这个仓库做了什么

| 步骤 | 结果 |
| --- | --- |
| `git init -b main` | 初始化本地仓库（默认分支 `main`） |
| 写入 `README.md` / `CONTRIBUTORS.md` | 项目说明与贡献者名册 |
| 放入 `assets/avatar*.png` | 采用 DeepSeek 官方蓝鲸标识作为头像 |
| 以 `DeepSeek Harness <342685585+dsh-rimielab[bot]@users.noreply.github.com>` 提交 | 署名落到 commit 的 author 字段，并关联到 GitHub 上的机器人账号 |

## 侧栏那个 Contributors 盒子是怎么来的

仓库首页右侧栏的 **Contributors** 区块（以及 `/graphs/contributors` 页面、
`GET /repos/{owner}/{repo}/contributors` 接口）三者同源，都由仓库的贡献者统计生成。
规则只有一条：

> **commit 的 author 邮箱必须属于某个 GitHub 账号的已验证邮箱，该账号才会出现在这里。**

由此推出几个容易踩的点：

- 它**不是**由仓库里的任何文件生成的 —— 放 `CONTRIBUTORS.md`、放头像图片都不会让它出现。
- 盒子里的头像是**那个 GitHub 账号的 profile 头像**，不是仓库里的 `assets/avatar.png`。
- 邮箱关联不到账号的提交会被记为 *Anonymous*：只出现在 `?anon=1` 的结果里，
  侧栏盒子和贡献者图表都不显示。
- 因此当一个仓库的提交全部来自未关联邮箱时，盒子就显示 **No contributors**。

本仓库把两种状态都走了一遍。

**阶段一：匿名邮箱** `dsh@deepseek-harness.invalid`

| 检查项 | 结果 |
| --- | --- |
| 侧栏 Contributors 盒子 | **No contributors** |
| `GET /repos/…/contributors` | `[]` |
| `GET /repos/…/contributors?anon=1` | `[{"name":"DeepSeek Harness","type":"Anonymous","contributions":1}]` |
| commits 里的 `author` 字段 | `null`（未关联任何账号） |

**阶段二：改用 GitHub App 的机器人身份**（做法见下）

| 检查项 | 结果 |
| --- | --- |
| `graphs/contributors-data`（即侧栏盒子的数据源） | `[{"login":"dsh-rimielab[bot]","total":<提交数>,"avatar":"…/in/5321359"}]` |
| commits 里的 `author` 字段 | `dsh-rimielab[bot]`（已关联） |

### 让它显示出来的办法：用 GitHub App 的机器人账号

可以不注册任何新的用户账号。创建 GitHub App 时 GitHub 会附带一个机器人身份
`<app-slug>[bot]`，它有自己的头像（就是 App 的 logo）、自己的 ID，并且**会被计入贡献者**。
提交的作者邮箱用它的固定格式即可被正确归属：

```
<App ID>+<app-slug>[bot]@users.noreply.github.com
```

本仓库用的就是这一招：App 名 `dsh-rimielab`、App ID `342685585`，于是邮箱为
`342685585+dsh-rimielab[bot]@users.noreply.github.com`。
创建这个 App 时**不需要**给它任何仓库权限，也**不需要**安装到仓库上 ——
归属只看邮箱。

四个容易踩的坑：

- 贡献者统计是**异步缓存**的。改完邮箱后 `graphs/contributors-data` 会先返回
  `202 Accepted`（后台重算中），过一会儿再请求才会拿到数据。
- REST 的 `GET /repos/…/contributors` 缓存更久，可能长时间仍返回 `[]`，
  但侧栏盒子和图表用的是上面那个数据源，不受影响。
- 侧栏盒子里显示的是**账号登录名**（`dsh-rimielab[bot]`），
  而提交列表里的作者名是提交里的显示名（仍然是 `DeepSeek Harness`）。
- **`Co-authored-by:` 也计入贡献者统计**。本仓库实测：机器人 authored 6 次、
  co-authored 1 次，`contributors-data` 里报的就是 `total: 7`。
  也就是说，只想把某人记进贡献者名单时，不必把作者位置让给他，
  在提交信息里加一行 co-author 即可：

  ```
  Co-authored-by: Rimrose <44104592+SirTamago@users.noreply.github.com>
  ```

### 机器人身份的一个代价：没有 hovercard

鼠标悬停在 `dsh-rimielab[bot]` 上会显示 `Failed to fetch hovercard content: 404`，
而真实用户账号会弹出完整名片（姓名、签名、位置、所属组织、PRO 徽章）。

这不是 App 没配好，而是 GitHub 对 Bot 类型账号的通用行为：

| 账号 | `GET /users/<login>/hovercard` |
| --- | --- |
| `SirTamago`（User） | `200` |
| `dsh-rimielab[bot]` | `404` |
| `dependabot[bot]` | `404` |
| `github-actions[bot]` | `404` |
| `renovate[bot]` | `404` |

原因：hovercard 渲染的就是个人资料页的内容，而 Bot 账号没有个人资料页 ——
`github.com/dsh-rimielab[bot]` 本身就返回 404，它的 `html_url` 指向
`https://github.com/apps/dsh-rimielab`，且 `name` / `bio` / `location` / `company` 全为 `null`。

结论：**想要 hovercard 就只能用真实 user 账号**。机器人身份能给的是一个独立身份、
自定义头像、以及指向 App 页面的链接。

## 贡献者

<table>
  <tr>
    <td align="center" width="180">
      <img src="assets/avatar-128.png" width="96" height="96" alt="DeepSeek Harness avatar" /><br />
      <strong>DeepSeek Harness</strong><br />
      <sub>DSH · AI coding agent</sub><br />
      <sub><a href="https://github.com/apps/dsh-rimielab"><code>dsh-rimielab[bot]</code></a></sub><br />
      <sub><code>342685585+dsh-rimielab[bot]@users.noreply.github.com</code></sub>
    </td>
    <td>
      本仓库的作者与全部提交者。负责仓库脚手架、文档撰写与头像素材整理。<br />
      详见 <a href="CONTRIBUTORS.md">CONTRIBUTORS.md</a>。
    </td>
  </tr>
  <tr>
    <td align="center" width="180">
      <img src="https://avatars.githubusercontent.com/u/44104592?v=4" width="96" height="96" alt="SirTamago avatar" /><br />
      <strong>Rimrose</strong><br />
      <sub>仓库所有者</sub><br />
      <sub><a href="https://github.com/SirTamago"><code>@SirTamago</code></a></sub>
    </td>
    <td>
      创建了 GitHub 仓库与 GitHub App <code>dsh-rimielab</code>（提供带头像的机器人身份），
      并确定了署名方案。步骤记录见 <a href="SETUP.md">SETUP.md</a>。
    </td>
  </tr>
</table>

> 上表的头像由本文件的 `<img>` 渲染，与侧栏那个 Contributors 盒子无关 —— 后者只认账号。


## 工作记录

项目的进度与每次改动都记在 **[devlog issue #2](https://github.com/SirTamago/dsh-contributors-test/issues/2)**，
由 `dsh-rimielab[bot]` 维护：**每次推送的摘要追加到正文顶部**（最新在上），
不新增评论 —— 编辑正文不会触发邮件通知，规则写在正文里。

写入由 [`.github/workflows/devlog.yml`](.github/workflows/devlog.yml) 自动完成 ——
每次 push 到 `main`，机器人就把本次推送的提交摘要追加进去。配置方式见
[SETUP.md](SETUP.md#自动工作记录devlog)。

## 头像素材

头像使用 **DeepSeek 官方蓝鲸标识**，不是自行设计的图形。来源与再生成方式见
[`assets/SOURCES.md`](assets/SOURCES.md)。

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| [`assets/avatar.png`](assets/avatar.png) | 460×460 | 方形头像位图（白底蓝鲸，取自 GitHub 组织头像） |
| [`assets/avatar-128.png`](assets/avatar-128.png) | 128×128 | README / 名册内嵌 |
| [`assets/avatar-transparent.png`](assets/avatar-transparent.png) | 225×225 | 透明底蓝鲸，便于叠加到其他底色 |

品牌色：`#4D6BFE`。

> 蓝鲸是 DeepSeek 的商标 / 品牌标识，版权归 DeepSeek 所有。此处仅作个人测试仓库的占位头像使用，
> 不代表 DeepSeek 官方，也不应被用来暗示官方背书。

## 许可

仓库内容（不含 DeepSeek 商标素材）以 MIT 许可发布，见 [LICENSE](LICENSE)。
