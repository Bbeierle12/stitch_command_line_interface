# Deployment Guide

## Production Build

### 1. Build Static Assets
```powershell
npm run build
```

Output: `dist/` directory with optimized HTML, CSS, JS

### 2. Preview Build Locally
```powershell
npm run preview
```

Opens production build at `http://localhost:4173`

---

## Deployment Options

### Option A: Static Hosting (Vercel, Netlify, GitHub Pages)

#### Vercel
```powershell
npm install -g vercel
vercel
```

Follow prompts. Auto-detects Vite config.

#### Netlify
```powershell
npm install -g netlify-cli
netlify deploy --prod
```

Or drag `dist/` folder to https://app.netlify.com/drop

#### GitHub Pages
```powershell
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

---

### Option B: Docker Container

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Build and run:
```powershell
docker build -t hacker-dashboard .
docker run -p 8080:80 hacker-dashboard
```

---

### Option C: Node.js Server (Express + Vite Preview)

Create `server.js`:
```js
import express from 'express';
import { createServer as createViteServer } from 'vite';

const app = express();
const vite = await createViteServer({
  server: { middlewareMode: true }
});

app.use(vite.middlewares);
app.listen(3000, () => {
  console.log('Dashboard running on http://localhost:3000');
});
```

Package:
```powershell
npm install express
node server.js
```

---

## Environment Variables

Create `.env.production`:
```env
VITE_API_ENDPOINT=https://api.yourcompany.com
VITE_TELEMETRY_ENABLED=false
VITE_ENABLE_DEBUG=false
```

Access in code:
```ts
const apiUrl = import.meta.env.VITE_API_ENDPOINT;
```

---

## Performance Optimization

### Enable Compression
Install `vite-plugin-compression`:
```powershell
npm install --save-dev vite-plugin-compression
```

Update `vite.config.ts`:
```ts
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [react(), compression()]
});
```

### Code Splitting
Vite automatically splits by routes. For manual chunks:
```ts
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom'],
        'charts': ['d3', 'recharts']
      }
    }
  }
}
```

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

const NetworkCard = lazy(() => import('./components/NetworkCard'));

// In render:
<Suspense fallback={<LoadingSkeleton />}>
  <NetworkCard />
</Suspense>
```

---

## API Integration

### Replace Mock Service

Edit `src/services/dataService.ts`:
```ts
export class DataService {
  private baseUrl = import.meta.env.VITE_API_ENDPOINT || '/api';

  async getCiState(): Promise<CiState> {
    const res = await fetch(`${this.baseUrl}/ci/status`);
    if (!res.ok) throw new Error('Failed to fetch CI state');
    return res.json();
  }

  // WebSocket for real-time updates:
  subscribeToLogs(callback: (log: LogLine) => void) {
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/logs`);
    ws.onmessage = (event) => callback(JSON.parse(event.data));
    return () => ws.close();
  }
}
```

---

## Security Checklist

- [ ] Enable HTTPS (use Cloudflare, Let's Encrypt, or cloud provider SSL)
- [ ] Set `Content-Security-Policy` headers
- [ ] Sanitize all user inputs (especially command palette)
- [ ] Rate-limit API endpoints
- [ ] Implement authentication (JWT, OAuth2)
- [ ] Use environment variables for secrets (never commit `.env.production`)
- [ ] Enable CORS only for trusted origins
- [ ] Audit dependencies: `npm audit fix`

---

## Monitoring

### Add Error Tracking (Sentry)
```powershell
npm install @sentry/react @sentry/vite-plugin
```

```tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1
});
```

### Performance Monitoring
Use browser DevTools or Lighthouse:
```powershell
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:4173 --view
```

Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >90

---

## Continuous Deployment

### GitHub Actions Example

`.github/workflows/deploy.yml`:
```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Troubleshooting

### Build Fails
- Clear cache: `rm -rf node_modules dist .vite && npm install`
- Check Node version: `node -v` (requires 18+)
- Review `vite.config.ts` for syntax errors

### Assets Not Loading
- Verify `base` in `vite.config.ts` matches deployment path
- Check browser console for 404s
- Ensure CORS headers allow asset origins

### Performance Issues
- Enable gzip/brotli compression on server
- Use CDN for static assets
- Implement service worker for offline caching

---

## Rollback Strategy

Keep 3 most recent builds:
```powershell
# Tag releases
git tag -a v1.0.0 -m "Production release"
git push origin v1.0.0

# Rollback
git checkout v0.9.0
npm run build
# Deploy dist/
```

---

## Support

For production issues:
- Check browser console (F12)
- Review server logs (nginx/express)
- Monitor error tracking dashboard (Sentry)
- Test in production-like staging environment first
