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

GitHub 的 contributor 列表只在 commit author 邮箱**能关联到一个 GitHub 账号**时，
才会显示那个账号的头像和链接；关联不上时 GitHub 会显示一个自动生成的灰色占位头像。

因此：

- 本仓库里头像由 `README.md` / `CONTRIBUTORS.md` 直接以图片形式渲染 —— 这在 GitHub 页面上同样有效，视觉上就是「贡献者有头像」。
- 如果希望 GitHub 原生的 contributor 小方块也显示这个头像，需要一个 GitHub 账号并把
  `dsh@deepseek-harness.invalid` 加为该账号的邮箱（GitHub 账号目前只能由人注册，无法由程序创建）。
- 在没有账号之前，也可以把它作为 **co-author** 写进提交信息，让 GitHub 页面列出该身份：

  ```
  Co-authored-by: DeepSeek Harness <dsh@deepseek-harness.invalid>
  ```

## 许可

仓库内容（含头像素材）以 MIT 许可发布，见 [LICENSE](LICENSE)。
