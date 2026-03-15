# SovereignOS Deployment Guide

## 🚀 Deploy to Vercel

### Method 1: Vercel Web Interface (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select the sovereign-os repository
   - Click "Import"

3. **Configure Settings**
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: `.next`

4. **Environment Variables**
   Add these in Vercel dashboard:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=8d885400-2c82-473e-b9d0-bf5c580a9a5f
   PINATA_API_KEY=your-pinata-api-key
   PINATA_API_SECRET=your-pinata-secret
   PINATA_JWT=your-pinata-jwt
   NEXT_PUBLIC_GATEWAY_URL=your-gateway-url
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Method 3: GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub account to Vercel
3. Import the repository in Vercel
4. Configure environment variables
5. Deploy

## 🔧 Configuration Files

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_APP_URL": "https://sovereign-os.vercel.app"
  }
}
```

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
```

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Build passes locally (`npm run build`)
- [ ] All API endpoints working
- [ ] Database connections tested
- [ ] Service worker properly configured
- [ ] CORS issues resolved

## 🌐 Live Deployment

Once deployed, your SovereignOS will be available at:
- **Production**: https://sovereign-os.vercel.app
- **Preview**: https://sovereign-os-[branch].vercel.app

## 🔍 Features Available

- ✅ AI Agent Registration
- ✅ Human User Registration  
- ✅ Coinbase CDP Integration
- ✅ WalletConnect Support
- ✅ Agent Insurance
- ✅ AI Sharing System
- ✅ IPFS Backups
- ✅ Base Network Integration

## 🐛 Troubleshooting

### Build Errors
- Check `npm run build` locally first
- Verify all dependencies in package.json
- Check TypeScript errors

### Runtime Errors
- Verify environment variables
- Check API endpoints
- Monitor Vercel logs

### Performance Issues
- Enable Vercel Analytics
- Check Core Web Vitals
- Optimize images and assets

## 📞 Support

For deployment issues:
1. Check Vercel logs
2. Review build output
3. Test locally first
4. Contact Vercel support

---

**🎉 Your SovereignOS is ready for production deployment!**
