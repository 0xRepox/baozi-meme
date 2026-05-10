# 包子 $BAO

**The first memecoin on Solana where an AI agent handles the mint.**

Connect our MCP to Claude, say the word, you approve. The future of launches isn't a pump — it's a conversation.

---

## How it works

1. Connect your wallet at [baozi.meme](https://baozi.meme)
2. Sign once to register
3. Tell Claude `"mint me some bao"` via chat or MCP
4. Approve the transaction in your wallet
5. 250,000 $BAO lands in your wallet

---

## Token

| | |
|---|---|
| **CA** | `4nvqAiCuQKzhexpKrqevUZqZJP6z79uXhtU8v6B1Wm2U` |
| **Program** | `51FZiDCAqQMYwGxv9YgQa6jv3bs5r263PomDMrPPyg8E` |
| **Total Supply** | 10,000,000,000 |
| **Public Mint** | 5B (50%) — 20,000 slots |
| **LP Reserve** | 5B (50%) — 100% to Meteora at graduation |
| **Price** | 0.022 SOL per slot |
| **Per Slot** | 250,000 $BAO |
| **Max / Wallet** | 10 slots |
| **Team** | 0 — fair launch |

---

## MCP Setup (Claude Desktop)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "baozi": {
      "type": "http",
      "url": "https://mcp.baozi.meme"
    }
  }
}
```

Then tell Claude: `"mint me some bao"`

---

## Architecture

```
Claude (MCP) ──→ mcp.baozi.meme ──→ relayer.baozi.meme ──→ Solana
                                           │
                                    partial sign (relayer)
                                           │
                                    user approves in wallet
```

- **Relayer** — builds + partially signs transactions, enforces rate limits
- **MCP Server** — exposes `get_price`, `get_user_status`, `mint_tokens` to Claude
- **Anchor Program** — fixed-price mint, 10/wallet cap, auto-graduation at 20k slots
- **Web** — Next.js + Claude chat widget

---

## Stack

- Solana / Anchor 0.30
- Next.js 15 / Tailwind
- Hono (relayer)
- MCP over HTTP
- Vercel (web) · Railway (relayer + MCP)
