# TRON Event Subscription Demo (Java-tron + ZeroMQ)

This repo is a small, beginner-friendly demo that shows how to subscribe to **real-time events** from a **TRON Java-tron FullNode** using the built-in **ZeroMQ (native queue)** event stream.

It includes two simple Node.js subscribers:

- `block-watcher.js` — prints new **block** events
- `transaction-watcher.js` — prints **transaction** trigger events

You can extend the same pattern to **contract logs** (for TRC20 deposits like USDT) once your node is synced close to the latest Nile height.

---

## 1) What you get

- A running **Nile FullNode** with event subscription enabled (`--es`)
- A ZeroMQ publisher bound to `tcp://127.0.0.1:5555`
- Node.js scripts that connect, subscribe to a topic, and print messages

---

## 2) Requirements

### FullNode side
- A Java-tron FullNode running on **Nile** with an up-to-date DB (snapshot strongly recommended on Nile)
- `event.subscribe` configured with `useNativeQueue = true`
- Node started with the `--es` flag (event service is disabled by default)

### Subscriber side
- Node.js 20+
- `zeromq@5` (important: the `zmq.socket('sub')` API is from zeromq v5)

---

## 3) Repo structure

```
tron-event-subscription-demo/
  block-watcher.js
  transaction-watcher.js
  package.json
  package-lock.json
  node_modules/
```

---

## 4) Install dependencies (subscriber side)

From the repo root:

```bash
npm install
```

This repo uses:

- `zeromq@^5.3.1`

---

## 5) Configure your FullNode (Nile) for ZeroMQ events

Open your Nile config (example location we used):

```bash
nano /data/tron/config/config-nile.conf
```

Make sure your `event.subscribe` block looks like this (topic enables can vary):

```hocon
event.subscribe = {
  native = {
    useNativeQueue = true
    bindport = 5555
    sendqueuelength = 1000
  }

  contractParse = true,

  topics = [
    { triggerName = "block",       enable = true,  topic = "block" },
    { triggerName = "transaction", enable = true,  topic = "transaction" },

    // enable later when needed
    { triggerName = "contractevent", enable = false, topic = "contractevent" },
    { triggerName = "contractlog",   enable = false, topic = "contractlog" },
    { triggerName = "soliditylog",   enable = false, topic = "soliditylog" }
  ]

  filter = {
    fromblock = ""
    toblock = "latest"
    contractAddress = [ "" ]
    contractTopic = [ "" ]
  }
}
```

Notes:
- `bindport = 5555` means subscribers connect to `tcp://127.0.0.1:5555`.
- Start small (block/transaction). Enable more triggers later.

---

## 6) Start the FullNode with event subscription enabled

From your java-tron repo (example command we used):

```bash
java -Xmx8g -jar build/libs/FullNode.jar -c /data/tron/config/config-nile.conf --es
```

**Important:** if you do not include `--es`, you will not receive any events.

---

## 7) Run the watchers

### Block watcher

```bash
node block-watcher.js
```

Expected output (example):

```
Subscribed to block events on tcp://127.0.0.1:5555
topic: block
msg: {"timeStamp":...,"blockNumber":...}
----
```

### Transaction watcher

```bash
node transaction-watcher.js
```

Expected output:

```
Subscribed to transaction events on tcp://127.0.0.1:5555
topic: transaction
msg: {...}
----
```

---

## 8) Helpful operational commands

### Check your node is running with `--es`

```bash
ps -ef | grep FullNode.jar | grep -v grep
```

### Check ZeroMQ port is listening

```bash
ss -ltnp | grep 5555
```

### Check local height (your node)

```bash
curl -s -X POST http://127.0.0.1:8090/wallet/getnowblock | jq '.block_header.raw_data.number'
```

### Compare with public Nile height

```bash
curl -s -X POST https://nile.trongrid.io/wallet/getnowblock | jq '.block_header.raw_data.number'
```

If your local height is far behind public Nile, you will miss recent TRC20 transfers and will not see their contract logs.

### Look up a transaction in your local node DB

```bash
TXID="..."
curl -s -X POST http://127.0.0.1:8090/wallet/gettransactionbyid \
  -H 'content-type: application/json' \
  -d "{\"value\":\"$TXID\"}" | jq '.raw_data.contract[0].type'
```

- If this returns `null`, your node does not have that transaction yet (not synced to that block).

### Look up a transaction receipt/logs (local)

```bash
TXID="..."
curl -s -X POST http://127.0.0.1:8090/wallet/gettransactioninfobyid \
  -H 'content-type: application/json' \
  -d "{\"value\":\"$TXID\"}" | jq '.log'
```

- TRC20 transfers usually produce at least one log (`Transfer`).


## 9) Snapshot bootstrap (recommended on Nile)

If your local height is extremely low compared to public Nile, syncing will take a very long time.
The practical solution is to bootstrap from a **recent Nile DB snapshot** and start the node from that DB.


## References (official docs)
- Java-tron Event Subscription (ZeroMQ, `--es`, `bindport`, topics): https://tronprotocol.github.io/documentation-en/architecture/event/
- TRONGrid endpoints (Mainnet/Shasta/Nile): https://developers.tron.network/v4.7.3/docs/exchangewallet-integrate-with-the-tron-network


---

## License
MIT
