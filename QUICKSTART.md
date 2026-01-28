# Quick Start Guide

## Choose Your Version

### 🚀 Fast Start: standalone.html
**Best for:** Quick demo, no installation, works everywhere

**How to run:**
1. Open `standalone.html` directly in your browser
2. That's it! No build, no dependencies, no server needed.

**Features:**
- Custom 3D renderer
- Physics simulation
- Touch and mouse controls
- Runs at 60 FPS

---

### 🎨 Advanced: index.html + app.js
**Best for:** Best graphics quality, professional rendering

**How to run:**
1. Install Node.js if you don't have it
2. Run: `npm install`
3. Run: `npm run dev`
4. Open: http://localhost:8080

**Features:**
- Babylon.js WebGL/WebGPU engine
- Full PBR materials
- Advanced shadows and reflections
- Cannon.js physics

---

## Controls (Both Versions)

### Desktop
- **Left-click and drag**: Rotate camera
- **Click**: Shoot projectile at objects
- **Mouse wheel**: Zoom (Babylon.js version only)

### Mobile
- **Touch and drag**: Rotate camera
- **Tap**: Shoot projectile
- **Pinch**: Zoom (Babylon.js version only)

### Buttons
- 🔄 **Reset**: Rebuild the tower
- 📦 **Add Stack**: Add more boxes
- 🌍 **Toggle Gravity**: Turn gravity on/off

---

## Which Should I Use?

| Feature | standalone.html | index.html |
|---------|----------------|------------|
| Installation | ❌ None | ✅ npm install |
| Dependencies | ❌ Zero | ✅ Node.js required |
| File Size | 15 KB | ~2 MB |
| Graphics Quality | Good | Excellent |
| Performance | 60 FPS | 60 FPS |
| PBR Materials | Simulated | Real |
| Best For | Quick demo | Production use |

**Recommendation:** Start with `standalone.html` to see it in action, then try the Babylon.js version for the full experience!

---

## Troubleshooting

### standalone.html won't load
- Make sure you're using a modern browser (Chrome, Firefox, Safari, Edge)
- Try a different browser
- Check browser console for errors (F12)

### Babylon.js version issues
- Make sure you ran `npm install`
- Check that the server is running on port 8080
- Try `npm run dev` instead of `npm start`
- Clear browser cache

### Performance issues
- Close other browser tabs
- Reduce window size
- Try the standalone.html version
- Update your graphics drivers

---

## Have Fun!

Shoot boxes, watch them fall, and enjoy the physics! 🎮
