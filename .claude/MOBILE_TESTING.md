# Mobile Testing (Same Wi-Fi)

To access the dev server from your phone on the same network:

```bash
npm run dev -- --host
```

Vite will print something like:

```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

Open the **Network** URL on your phone's browser.

## Notes

- Both devices must be on the same Wi-Fi network.
- The IP changes depending on your network — always check the terminal output.
- If the phone can't connect, check your firewall and make sure port 5173 is not blocked.
