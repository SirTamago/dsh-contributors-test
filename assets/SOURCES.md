# 头像素材来源

本目录下的头像**不是自行设计的图形**，而是 DeepSeek 官方蓝鲸标识，来源如下。

| 文件 | 来源 | 处理 |
| --- | --- | --- |
| `avatar.png` | `https://avatars.githubusercontent.com/u/148330874?v=4`（GitHub 组织 `deepseek-ai` 的组织头像） | 原样保存为 PNG，460×460 |
| `avatar-128.png` | 同上 | Lanczos 缩放到 128×128 |
| `avatar-transparent.png` | `https://www.deepseek.com/favicon.ico` | 取 ICO 内嵌位图转为 PNG，保留透明通道，225×225 |

品牌色：`#4D6BFE`（取自透明底素材的实心像素）。

## 重新获取

```bash
curl -sSL -o assets/avatar.png "https://avatars.githubusercontent.com/u/148330874?v=4"
curl -sSL -o assets/avatar-transparent.png "https://www.deepseek.com/favicon.ico"

python3 - <<'PY'
from PIL import Image
Image.open("assets/avatar.png").convert("RGB").resize((128, 128), Image.LANCZOS).save("assets/avatar-128.png")
Image.open("assets/avatar-transparent.png")  # ICO，仅供来源记录
PY
```

（`avatar-transparent.png` 由 `favicon.ico` 转换而来，转换命令见上表说明；
`.ico` 可直接用 Pillow 打开。）

## 版权

蓝鲸标识是 DeepSeek 的商标 / 品牌标识，版权归 DeepSeek 所有。
本仓库仅将其作为个人测试仓库的占位头像，**不代表 DeepSeek 官方**，也不应用于暗示官方背书。
本仓库的 MIT 许可（见 [`../LICENSE`](../LICENSE)）不涵盖该商标素材。
