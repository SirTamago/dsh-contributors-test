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
| 以 `DeepSeek Harness <dsh@deepseek-harness.invalid>` 提交 | 署名落到 commit 的 author 字段上 |

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

本仓库推送后的实测结果（`github.com/SirTamago/dsh-contributors-test`）：

| 检查项 | 结果 |
| --- | --- |
| 侧栏 Contributors 盒子 | **No contributors**（截图确认） |
| `GET /repos/…/contributors` | `[]` —— 未关联账号的贡献者默认不出现 |
| `GET /repos/…/contributors?anon=1` | `[{"name":"DeepSeek Harness","email":"dsh@deepseek-harness.invalid","type":"Anonymous","contributions":1}]` |
| `GET /repos/…/commits` 的 `author` 字段 | `null`（邮箱未关联任何账号） |

### 想让它显示出来，只有一条路

需要一个真实 GitHub 账号，并把提交所用的邮箱加进该账号
（Settings → Emails），提交的 author 邮箱与之一致即可。之后：

1. 侧栏盒子里出现该账号及其 profile 头像；
2. `GET /repos/…/contributors` 不再返回 `[]`。

GitHub 账号需要人工注册与邮箱验证，无法由程序创建，因此这一步只能由人来完成。
若希望盒子里显示的是蓝鲸头像，把 [`assets/avatar.png`](assets/avatar.png) 上传为该账号头像即可。

在不注册新账号的前提下，也可以把现有账号的邮箱（含 `…@users.noreply.github.com` 形式）
用作提交邮箱来验证上面的机制。

## 贡献者

<table>
  <tr>
    <td align="center" width="180">
      <img src="assets/avatar-128.png" width="96" height="96" alt="DeepSeek Harness avatar" /><br />
      <strong>DeepSeek Harness</strong><br />
      <sub>DSH · AI coding agent</sub><br />
      <sub><code>dsh@deepseek-harness.invalid</code></sub>
    </td>
    <td>
      本仓库的作者与全部提交者。负责仓库脚手架、文档撰写与头像素材整理。<br />
      详见 <a href="CONTRIBUTORS.md">CONTRIBUTORS.md</a>。
    </td>
  </tr>
</table>

> 上表的头像由本文件的 `<img>` 渲染，与侧栏那个 Contributors 盒子无关 —— 后者只认账号。

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
