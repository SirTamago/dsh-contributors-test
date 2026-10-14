# dsh-contributor-test

一个用来验证「非人类贡献者」能否在 Git 仓库里被正确署名、并拥有自己头像的实验仓库。

仓库由 **DeepSeek Harness (DSH)** 初始化并提交：README、文档、以及头像素材全部由它生成。

---

## 这个仓库做了什么

| 步骤 | 结果 |
| --- | --- |
| `git init -b main` | 初始化本地仓库（默认分支 `main`） |
| 写入 `README.md` / `CONTRIBUTORS.md` | 项目说明与贡献者名册 |
| 生成 `assets/avatar.*` | DSH 自己的头像（矢量 + 位图，可复现） |
| 以 `DeepSeek Harness <dsh@deepseek-harness.invalid>` 提交 | 署名落到 commit 的 author 字段上 |

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
      本仓库的作者与初始提交者。负责仓库脚手架、文档撰写、头像素材的程序化生成
      (<code>assets/make_avatar.py</code>)，以及全部 commit。<br />
      详见 <a href="CONTRIBUTORS.md">CONTRIBUTORS.md</a>。
    </td>
  </tr>
</table>

## 头像

头像是原创图形：蓝色圆底 + 白色「轭轮」（中心实心圆、八根渐细辐条、一圈轭环）。
它和 Claude 的 GitHub 头像属于同一类视觉语言（高饱和圆底 + 白色放射状几何标记），
但不是同一个图形，也不含任何第三方商标。

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| [`assets/avatar.svg`](assets/avatar.svg) | 512×512 viewBox | 矢量源文件，任意缩放 |
| [`assets/avatar.png`](assets/avatar.png) | 512×512 | 头像位图 |
| [`assets/avatar-128.png`](assets/avatar-128.png) | 128×128 | README / 名册内嵌 |

重新生成（需要 Pillow）：

```bash
python3 assets/make_avatar.py
```

配色与几何参数集中在 `assets/make_avatar.py` 顶部的 design tokens 中，改一行即可换色。

## 关于「GitHub 上搜不到 DSH 账号」

GitHub 只把 commit author 邮箱**能关联到某个账号**的提交算作「已注册贡献者」；
关联不上的提交会以 *Anonymous* 身份记录，原生 contributor 图里给的是自动生成的灰色占位头像。

下面是本仓库推送后在 `github.com/SirTamago/dsh-contributors-test` 上实测到的结果：

| 检查项 | 结果 |
| --- | --- |
| `GET /repos/…/contributors` | `[]` —— 未关联账号的贡献者默认**不出现** |
| `GET /repos/…/contributors?anon=1` | `{"email":"dsh@deepseek-harness.invalid","name":"DeepSeek Harness","type":"Anonymous","contributions":1}` |
| `GET /repos/…/commits` 的 `author` 字段 | `null`（邮箱未关联任何账号） |

所以要分清两件不同的事：

- **仓库页面上的头像** —— 由 `README.md` / `CONTRIBUTORS.md` 以 `<img>` 直接渲染，GitHub 页面上同样生效，这里是自定义头像。
- **GitHub 原生的 contributor 小方块** —— 在邮箱关联到真实账号之前，只能是灰色占位头像。GitHub 账号需要人工注册与邮箱验证，无法由程序创建。

在不注册账号的前提下，还有一条可选做法：把它写成 **co-author** 预告到提交信息里，
GitHub 会在提交页面列出该身份（仍然沿用占位头像）：

```
Co-authored-by: DeepSeek Harness <dsh@deepseek-harness.invalid>
```

## 许可

仓库内容（含头像素材）以 MIT 许可发布，见 [LICENSE](LICENSE)。
