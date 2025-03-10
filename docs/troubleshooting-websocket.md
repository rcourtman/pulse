# Troubleshooting WebSocket Connection Issues

If you're experiencing the "Connection error: websocket error" message when using Pulse, this guide will help you resolve the issue.

## Understanding the Problem

The WebSocket connection error typically occurs when:

1. The frontend client is trying to connect to `localhost` or `127.0.0.1` instead of the actual server IP
2. There's a network configuration issue preventing WebSocket connections
3. Docker networking is interfering with the WebSocket connection
4. A reverse proxy is not properly configured for WebSocket traffic

## Quick Fixes (Secure Options)

Try these solutions in order:

### 1. Use the latest version of Pulse

Make sure you're using Pulse version 1.5.2 or later, which includes fixes for WebSocket connection issues:

```bash
docker pull rcourtman/pulse:latest
docker compose down
docker compose up -d
```

### 2. Remove VITE_API_URL from your .env file

If you've set `VITE_API_URL` in your `.env` file, try removing it completely. Pulse is designed to automatically determine the correct connection URL.

### 3. Access Pulse directly by IP address

Instead of using a domain name or localhost, try accessing Pulse directly by its IP address:
```
http://192.168.x.x:7654
```

### 4. Check your reverse proxy configuration

If you're using a reverse proxy (like Nginx or Apache), make sure it's properly configured for WebSocket connections:

#### Nginx Configuration

```nginx
location /socket.io {
    proxy_pass http://your-pulse-server:7654;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}

location / {
    proxy_pass http://your-pulse-server:7654;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### Apache Configuration

```apache
RewriteEngine On
RewriteCond %{REQUEST_URI}  ^/socket.io            [NC]
RewriteCond %{QUERY_STRING} transport=websocket    [NC]
RewriteRule /(.*)           ws://your-pulse-server:7654/$1 [P,L]

ProxyPass / http://your-pulse-server:7654/
ProxyPassReverse / http://your-pulse-server:7654/
```

## Last Resort: Host Network Mode

If none of the above solutions work, you can use Docker's host network mode as a last resort. Note that this has security implications as it gives the container full access to the host's network stack.

```yaml
# In your docker-compose.yml
services:
  pulse-app:
    image: rcourtman/pulse:latest
    # ... other settings ...
    network_mode: "host"
```

**Security Considerations with Host Network Mode:**
- The container shares the host's entire network namespace
- It can bind to any port on the host
- It has access to all host network interfaces
- It bypasses Docker's network isolation
- It increases the attack surface if the container is compromised

Only use this option if you understand these risks and have no other choice.

## Debugging the Connection

To debug the WebSocket connection:

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Filter for "WS" or "WebSocket"
4. Reload the page
5. Look for connection attempts to `/socket.io`

If you see failed connection attempts to `ws://localhost:7654` or `ws://127.0.0.1:7654` when you're accessing Pulse from a different IP, that's the root of the problem.

## Advanced Solutions

### For Docker Users

Try these alternatives to host network mode:

1. Use the latest version of Pulse (1.5.2+) which includes fixes for WebSocket connection issues
2. Explicitly set the container's IP in your `.env` file:
   ```
   VITE_API_URL=http://your-server-ip:7654
   ```
3. Make sure port 7654 is properly exposed in your Docker configuration
4. Consider using Docker's macvlan network driver for advanced networking needs

### For Kubernetes Users

If you're running Pulse in Kubernetes:

1. Make sure your Service and Ingress are configured to handle WebSocket connections
2. Set the proper annotations for WebSocket support on your Ingress
3. Use a LoadBalancer or NodePort service type to expose the WebSocket endpoint

## Still Having Issues?

If you're still experiencing WebSocket connection problems after trying these solutions:

1. Check your browser console for specific error messages
2. Look at the Docker logs: `docker logs pulse-app`
3. Try a different browser or device
4. Ensure no firewall is blocking WebSocket connections on port 7654

For additional help, please open an issue on GitHub with:
- Your exact configuration
- Browser console logs
- Docker logs
- Network environment details 