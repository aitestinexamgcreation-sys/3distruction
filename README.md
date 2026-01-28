# 3Distruction - Mobile Destruction Emulator

A beautiful 3D destruction physics simulator with advanced graphics, optimized for mobile devices.

## Features

✨ **Beautiful Graphics**
- Physically Based Rendering (PBR) materials for realistic surfaces
- Advanced lighting system with RTX-like reflections
- Real-time shadows with PCF filtering
- HDR tone mapping and post-processing effects
- Environment reflections and specular highlights

🎮 **Physics Simulation**
- Real-time physics using Cannon.js
- Destructible objects with realistic collisions
- Force application on touch/click
- Gravity and friction simulation

📱 **Mobile Optimized**
- Touch controls with pinch-to-zoom
- Responsive design for all screen sizes
- Hardware-accelerated rendering
- Optimized performance for mobile GPUs

🛠️ **Technology Stack**
- **Babylon.js 7.0** - WebGL/WebGPU 3D engine
- **Cannon.js** - Physics engine
- **PBR Materials** - Realistic rendering
- **WebGL 2.0** - Graphics API (WebGPU ready)

## Getting Started

### Quick Start (No Installation Required)

Simply open `index.html` in a modern web browser that supports WebGL 2.0.

### Local Development Server

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:8080
```

## Controls

- **Mobile**: Touch and drag to rotate the camera, pinch to zoom
- **Desktop**: 
  - Left-click and drag to rotate camera
  - Mouse wheel to zoom
  - Click on objects to apply force
- **Buttons**:
  - "Reset Scene" - Rebuild the tower
  - "Add Box" - Drop a new box from above

## How It Works

### Advanced Rendering

The application uses **Physically Based Rendering (PBR)** which simulates how light interacts with surfaces in the real world:

- **Metallic/Roughness workflow**: Controls how reflective and smooth surfaces appear
- **ACES Tone Mapping**: Film-industry standard color grading for realistic output
- **Image Processing**: HDR, contrast, and exposure adjustments

### Lighting System

Multiple light sources create depth and realism:
- **Directional Light**: Simulates sunlight with shadows
- **Hemisphere Light**: Ambient lighting from sky and ground
- **Point Light**: Dynamic highlights

### Shadow System

High-quality shadows using:
- 2048x2048 shadow maps
- Percentage Closer Filtering (PCF) for soft edges
- Optimized shadow bounds for performance

### Physics

- Objects have mass, friction, and restitution (bounciness)
- Collision detection between all objects
- Impulse-based interactions on touch/click

## Browser Compatibility

Works best on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (iOS/macOS)
- Opera 76+

Requires WebGL 2.0 support.

## Performance Tips

For best performance on mobile:
- Close other apps to free up memory
- Use the latest browser version
- Enable hardware acceleration in browser settings

## Future Enhancements

Potential additions:
- WebGPU support for even better performance
- More destruction types (fracture, shatter)
- Particle effects for debris
- Sound effects
- Score system
- Multiple scenes and levels

## License

MIT License - Feel free to use and modify! 
