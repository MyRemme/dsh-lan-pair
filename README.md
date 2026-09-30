# dsh-lan-pair

内网配对远程访问插件，用于 [DSH（DeepSeek Harness）](https://github.com/deepseek-ai)：让手机或另一台电脑通过**扫码 / 配对令牌**接入同一份 DSH Web 界面，并且可以选择让内网设备**无需密钥直接打开界面**。

本插件由 [`@linxin666/dsh-remote-web-ui`](https://www.npmjs.com/package/@linxin666/dsh-remote-web-ui) 0.4.4 改造而来，**已彻底移除全部公网功能**，只保留内网场景。

## 与上游的差异

上游提供公网访问能力（Cloudflare 隧道等）。本插件把这些全部删除，只做内网：

| 已移除 | 说明 |
| --- | --- |
| Cloudflare 快速隧道 / 命名隧道 | 含 `cloudflared` 依赖、`tunnelToken`、`autoTunnel` 配置 |
| dsh-market 固定域名中继 | relay 注册与身份文件 |
| `publicBaseUrl` 与公网状态帧 | 含面板上的公网地址单选与角标 |
| 每日匿名遥测上报 | 上游会向 `dsh-market.com` 上报心跳，已改为惰性空函数 |

## 功能

- **二维码配对**：本机面板签发配对链接，手机扫码即可接入
- **配对令牌**：可直接复制令牌/链接，不依赖摄像头
- **设备会话管理**：已授权设备列表、在线状态、单独吊销
- **内网免密钥访问**（默认开启）：同一内网的设备无需配对、无需令牌，直接打开 Web 界面，不再反复要求认证
- **局域网绑定**：自动把 Web 服务绑定改写为 `0.0.0.0`，并维护主机防火墙放行规则

## 安装

本插件以「本地包」形式装入 DSH profile。以 desktop profile 为例：

1. 把本仓库放进 profile 的依赖目录：

   ```
   <DSH_HOME>/profiles/<profile>/node_modules/dsh-lan-pair/
   ```

2. 在该 profile 的 `package.json` 中登记依赖与 bundle：

   ```jsonc
   {
     "dependencies": {
       "dsh-lan-pair": "file:./node_modules/dsh-lan-pair"
     },
     "dsh": {
       "profile": {
         "bundles": [
           // ... 其他 bundle
           "dsh-lan-pair"
         ]
       }
     }
   }
   ```

3. 重启 DSH。插件代码位于 `node_modules` 下，而 DSH 的热重载会忽略该目录，因此**改动插件后必须重启**才能生效。

## 配置

在 profile 的 `cordis.patch.yml` 中配置插件行：

```yaml
- id: lan-pair
  name: "dsh-lan-pair"
  config:
    lanBind: true              # 把 Web 服务绑定改写为 0.0.0.0，并维护防火墙规则
    allowLanWithoutKey: true   # 内网设备无需配对/令牌直接打开界面
    maxDevices: 32             # 已授权设备上限
    idleExpireMs: 315360000000 # 设备空闲过期（毫秒）
    # requirePairingForLan: true # 默认 true，通常无需显式设置
```

也可以在 DSH 的设置卡片里图形化调整这些开关。

### 关于「内网免密钥」与「局域网访问要求配对」的关系

内网免密钥的实现依赖门控的 `/remote` 通道——只有它会把内网请求送到 harness，并附上进程自身的凭据。因此：

- `allowLanWithoutKey: true` 时，插件**会强制保留**该通道，与 `requirePairingForLan` 取值无关；
- 若两者都关，内网请求会走普通 `/api`，被 harness 的信任围栏挡为 `403`。

这一点在实现里已做兜底，不会出现「界面能打开、但所有 API 全废」的情况。

## 安全提醒

`allowLanWithoutKey: true` 意味着**同一内网内的任何设备**都能直接打开完整的 DSH Web 界面，其权限等同于该 DSH 实例本身的权限（若你的 profile 是 `danger-full-access`，则等同于完整控制权）。

在不可信网络（公共 WiFi、合租网络）中请关闭该开关，改为必须扫码配对。关闭后配对闸门立即恢复。

## 实现说明

- 本仓库发布的是**构建产物**（`lib/*.js`），不含 TypeScript 源码。产物为未压缩 ESM，保留了 `//#region` 标记与完整注释，可直接阅读与修改。
- 插件分两半：Host 半（Node ESM，`lib/index.js`）与 Client 半（浏览器 bundle，`lib/client.js`）。
- Host 半注册一条 exact `/` 路由以支持内网免密钥：内网来源直接获得注入好的应用外壳，其余来源原样交回 harness 的 fallback，因此桌面端行为完全不受影响。

## 许可证

Apache-2.0。基于 `@linxin666/dsh-remote-web-ui` 0.4.4 改造，原始许可证见 `LICENSE`。