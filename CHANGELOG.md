# 更新日志

本文件记录本仓库的改动。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 修复

- **内网判定可被 Host 头欺骗（严重）**：`isPrivateOrLocalHostname` 与 `isPrivateLanRequest` 用
  `startsWith("fc")` / `startsWith("fd")` / `startsWith("fe80")` 判断 IPv6 私有地址，但这些前缀
  对字符串生效，因此 `fcorp.example.com`、`fdic.gov`、`fe80evil.example.com` 这类域名会被判定为
  内网来源，在开启内网免密钥时被直接放行。现在改为解析首个 16 位组并按 `fc00::/7`（ULA）与
  `fe80::/10`（link-local）做位掩码判定，非 IPv6 字面量一律不匹配。顺带补齐了原实现漏判的
  `fe90`–`febf` 整段 link-local 地址。
- **配置文档回收时删掉外来行（严重）**：`stripManagedBlock` 删除托管块时会把块内所有行一并丢弃。
  DSH 的配置编辑器可能把用户新增的条目追加到文件末尾，若托管块恰好位于末尾，那些条目会在下一次
  回收时永久丢失。现在回收时保留所有非本插件写入的行。
- **`idleExpireMs` 默认值三处不一致**：代码默认 30 天，设置界面提示写的是 7 天。界面文案已与
  代码对齐。
- **README 默认值过时**：`maxDevices` 写成 32（代码为 4），`idleExpireMs` 写成 315360000000
  （代码为 2592000000）。已与 `Config` 定义对齐。
- **不变量伴生插件是空实现且描述失实**：`lib/invariant.js` 的 `install` 是空函数，注释却声称
  存在校验路由表与设备会话关系的测试文件，而仓库中没有任何测试文件；同时它的签名 `() => {}`
  不接收官方契约要求的 `(ctx, fail)` 参数。现在改为一条真实可执行的检查：断言 Host 半声明的
  设置命名空间与 Client 半订阅的命名空间一致 —— 这两处都是产物中的字面量，任一侧改名都不会
  报错，只会在运行时表现为设置卡片空白。
- **`peerDependencies` 范围过宽**：`@deepseek-ai/dsh` 的最后一个区间 `>=0.5.0-rc.1` 没有上界，
  会把未来所有大版本都判为兼容。已补上 `<0.6.0-0`。
- **`files` 漏发文档**：`README.md` 与 `LICENSE` 不在发布白名单内。

### 移除

- **死代码 `makeGateListener` 与 `api/gate` 监听**：DSH 的 `api/gate` 事件在整个安装树中没有任何
  发出方（`dsh-tool-cordis` 的事件目录里也不存在任何 `api/*` 事件），因此该监听从未被调用。已删除
  监听函数、注册块及相关注释；本插件现在不再发出或监听任何事件。

### 变更

- `keywords` 补充 `dsh-plugin`，与仓库的 GitHub topic 保持一致。
- 三个 `lib/*.js` 构建产物加上 Apache-2.0 §4(b) 要求的显著变更声明。
- README 增加「与已安装副本的关系」一节，说明本仓库是唯一权威来源，以及被外部工具改写过的
  副本如何回到权威状态。
- README 说明不变量伴生插件需要 composition 挂载 `@deepseek-ai/dsh-invariants` 才会运行；
  DSH 桌面版默认的 `dsh-base` / `dsh-web-app` 两个 bundle 都不挂载该服务，因此该检查在桌面版下
  不执行。

## [0.1.0]

首个版本。基于 `@linxin666/dsh-remote-web-ui` 0.4.4（Apache-2.0）改造，移除全部公网功能
（Cloudflare 隧道、命名隧道、dsh-market 固定域名中继、遥测上报），保留并扩展内网配对、
内网免密钥直连与防火墙规则管理。
