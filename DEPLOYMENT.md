# Burn Rate - Deployment Guide

This guide covers how to build, deploy, and distribute both the CLI and web versions of Burn Rate.

## Quick Start

### Build Everything
```bash
npm run build
```

### Deploy with Scripts
```bash
# Build and prepare for deployment
npm run deploy

# Production build
npm run deploy:prod

# Build only CLI version
npm run deploy:cli

# Build only web version
npm run deploy:web
```

## Build System Overview

The project uses a dual build system:
- **CLI Version**: Built with TypeScript compiler (`tsc`)
- **Web Version**: Built with Vite for optimized browser bundles

### Build Outputs

```
dist/
├── cli.js                 # CLI entry point
├── cli.d.ts              # CLI type definitions
├── engine/               # Game engine (shared)
├── models/               # Data models (shared)
├── ui/                   # UI components (shared)
├── web/                  # Web-specific build
│   ├── index.html        # Web entry point
│   ├── css/              # Optimized CSS bundles
│   └── js/               # Optimized JS bundles
└── deployment-info.json  # Build metadata
```

## CLI Version Deployment

### Building
```bash
npm run build:cli
```

### Running
```bash
node dist/cli.js
```

### Distribution
The CLI version is a single Node.js application that can be:
1. **NPM Package**: Publish to npm registry
2. **Standalone Executable**: Use tools like `pkg` or `nexe`
3. **Docker Container**: Create containerized version

### System Requirements
- Node.js 18+ 
- No additional dependencies (all bundled)

## Web Version Deployment

### Building
```bash
npm run build:web
```

### Local Development Server
```bash
# Using Vite dev server (development)
npm run dev:web

# Using Vite preview (production build)
npm run preview:web

# Using custom static server
npm run serve:web:static
```

### Production Deployment

The web version is a static site that can be deployed to:

#### 1. Static Hosting Services
- **Netlify**: Drag and drop `dist/web` folder
- **Vercel**: Connect GitHub repo, set build command to `npm run build:web`
- **GitHub Pages**: Upload `dist/web` contents
- **AWS S3**: Sync `dist/web` to S3 bucket with static hosting

#### 2. CDN Deployment
```bash
# Example with AWS CLI
aws s3 sync dist/web s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### 3. Traditional Web Servers

**Apache (.htaccess)**
```apache
RewriteEngine On
RewriteBase /

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<FilesMatch "\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
</FilesMatch>
```

**Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist/web;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Build Configuration

### Environment Variables

**Development**
```bash
NODE_ENV=development
VITE_DEBUG=true
VITE_LOG_LEVEL=debug
```

**Production**
```bash
NODE_ENV=production
VITE_DEBUG=false
VITE_LOG_LEVEL=error
```

### Build Optimization

The production build includes:
- **Code Splitting**: Separate chunks for engine, models, UI, and web components
- **Minification**: Terser for JavaScript, CSS optimization
- **Tree Shaking**: Remove unused code
- **Asset Optimization**: Compressed images and fonts
- **Source Maps**: For debugging (can be disabled for production)

### Bundle Analysis

To analyze bundle size:
```bash
npm run analyze:web
```

## Deployment Scripts

### Main Deployment Script (`scripts/deploy.sh`)

```bash
# Full deployment
./scripts/deploy.sh

# Options
./scripts/deploy.sh --cli-only      # CLI only
./scripts/deploy.sh --web-only      # Web only
./scripts/deploy.sh --production    # Production build
./scripts/deploy.sh --skip-tests    # Skip tests
```

### Static Web Server (`scripts/serve-web.js`)

A Node.js static file server for local testing:
```bash
node scripts/serve-web.js
```

Features:
- Serves files from `dist/web`
- SPA routing support (fallback to index.html)
- CORS headers for development
- Proper MIME types
- Basic caching headers

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run deploy:prod
      - name: Deploy to S3
        run: aws s3 sync dist/web s3://${{ secrets.S3_BUCKET }}
```

### Docker Deployment

**CLI Version Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/cli.js"]
```

**Web Version Dockerfile**
```dockerfile
FROM nginx:alpine
COPY dist/web /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

## Performance Considerations

### Web Version Optimization
- **Lazy Loading**: Components loaded on demand
- **Code Splitting**: Separate chunks for different game modules
- **Asset Compression**: Gzip/Brotli compression recommended
- **CDN**: Use CDN for static assets in production

### CLI Version Optimization
- **Single Bundle**: All dependencies included
- **Fast Startup**: Minimal initialization overhead
- **Memory Efficient**: Optimized for server environments

## Monitoring and Analytics

### Build Monitoring
- Track bundle sizes over time
- Monitor build performance
- Alert on build failures

### Runtime Monitoring
- Error tracking (Sentry, Rollbar)
- Performance monitoring (Web Vitals)
- Usage analytics (Google Analytics, Mixpanel)

## Troubleshooting

### Common Build Issues

**"Module not found" errors**
- Check import paths and file extensions
- Verify TypeScript configuration
- Ensure all dependencies are installed

**Large bundle sizes**
- Use bundle analyzer to identify large dependencies
- Implement code splitting
- Remove unused dependencies

**CSS issues**
- Check for syntax errors in CSS files
- Verify CSS import paths
- Ensure proper CSS processing in Vite config

### Deployment Issues

**404 errors on refresh (SPA)**
- Configure server for client-side routing
- Ensure fallback to index.html

**CORS errors**
- Configure proper CORS headers
- Check API endpoint configurations

**Performance issues**
- Enable compression (gzip/brotli)
- Configure proper caching headers
- Use CDN for static assets

## Security Considerations

### Web Version
- Content Security Policy (CSP) headers
- HTTPS in production
- Secure cookie settings
- Input validation and sanitization

### CLI Version
- Validate all user inputs
- Secure file operations
- Environment variable security
- Dependency vulnerability scanning

## Version Management

### Semantic Versioning
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

### Release Process
1. Update version in package.json
2. Create git tag
3. Build and test
4. Deploy to staging
5. Deploy to production
6. Create GitHub release

## Support and Maintenance

### Regular Tasks
- Update dependencies
- Security patches
- Performance optimization
- Bug fixes and improvements

### Monitoring
- Build success/failure rates
- Deployment frequency
- Error rates and performance metrics
- User feedback and issues