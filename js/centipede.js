// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 50;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Mouse tracking
const mouse = new THREE.Vector2();
const mouseWorld = new THREE.Vector3();

// Centipede parameters
const segmentCount = 20;
const segmentLength = 2;
const segmentRadius = 0.8;
const legLength = 2;
const legsPerSegment = 4;

// Centipede class
class Centipede {
    constructor() {
        this.segments = [];
        this.legs = [];
        this.joints = [];
        this.time = 0;
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(1.2, 8, 6);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            linewidth: 2
        });
        
        // Create segments
        for (let i = 0; i < segmentCount; i++) {
            const segment = new THREE.Group();
            
            // Segment body (wireframe sphere)
            const segGeometry = new THREE.SphereGeometry(
                segmentRadius * (1 - i * 0.02), 
                8, 
                6
            );
            const wireframe = new THREE.WireframeGeometry(segGeometry);
            const line = new THREE.LineSegments(wireframe, lineMaterial);
            segment.add(line);
            
            // Position segment
            segment.position.x = -i * segmentLength;
            
            // Create legs for this segment
            const segmentLegs = [];
            for (let j = 0; j < legsPerSegment; j++) {
                const legGroup = new THREE.Group();
                
                // Leg line
                const legGeometry = new THREE.BufferGeometry();
                const legVertices = new Float32Array([
                    0, 0, 0,
                    0, -legLength, 0
                ]);
                legGeometry.setAttribute('position', new THREE.BufferAttribute(legVertices, 3));
                
                const legLine = new THREE.Line(legGeometry, lineMaterial);
                legGroup.add(legLine);
                
                // Position leg around segment
                const angle = (j / legsPerSegment) * Math.PI * 2;
                legGroup.position.x = 0;
                legGroup.position.y = Math.cos(angle) * segmentRadius * 0.8;
                legGroup.position.z = Math.sin(angle) * segmentRadius * 0.8;
                
                // Only add legs to front/back of segment
                if (j % 2 === 0) {
                    segment.add(legGroup);
                    segmentLegs.push(legGroup);
                }
            }
            
            this.legs.push(segmentLegs);
            this.segments.push(segment);
            scene.add(segment);
        }
        
        // Add antennae to head
        const antennaGeometry = new THREE.BufferGeometry();
        const antennaVertices = new Float32Array([
            0, 0, 0,
            2, 1, 0
        ]);
        antennaGeometry.setAttribute('position', new THREE.BufferAttribute(antennaVertices, 3));
        
        const antenna1 = new THREE.Line(antennaGeometry, lineMaterial);
        const antenna2 = new THREE.Line(antennaGeometry, lineMaterial);
        antenna2.rotation.z = -0.3;
        
        this.segments[0].add(antenna1);
        this.segments[0].add(antenna2);
    }
    
    update(targetX, targetY) {
        this.time += 0.05;
        
        // Update head position (first segment)
        const head = this.segments[0];
        const dx = targetX - head.position.x;
        const dy = targetY - head.position.y;
        
        // Smooth movement
        head.position.x += dx * 0.1;
        head.position.y += dy * 0.1;
        
        // Rotate head to face direction
        head.rotation.z = Math.atan2(dy, dx);
        
        // Update body segments
        for (let i = 1; i < this.segments.length; i++) {
            const segment = this.segments[i];
            const prevSegment = this.segments[i - 1];
            
            // Follow previous segment
            const targetX = prevSegment.position.x - Math.cos(prevSegment.rotation.z) * segmentLength;
            const targetY = prevSegment.position.y - Math.sin(prevSegment.rotation.z) * segmentLength;
            
            const dx = targetX - segment.position.x;
            const dy = targetY - segment.position.y;
            
            segment.position.x += dx * 0.3;
            segment.position.y += dy * 0.3;
            
            // Update rotation
            segment.rotation.z = Math.atan2(
                prevSegment.position.y - segment.position.y,
                prevSegment.position.x - segment.position.x
            );
            
            // Animate legs
            if (this.legs[i]) {
                this.legs[i].forEach((leg, index) => {
                    const walkCycle = Math.sin(this.time + i * 0.3 + index * Math.PI) * 0.3;
                    leg.rotation.x = walkCycle;
                    leg.rotation.z = walkCycle * 0.5;
                });
            }
        }
        
        // Add subtle body wave motion
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            segment.position.z = Math.sin(this.time * 0.5 + i * 0.3) * 0.5;
        }
    }
}

// Create centipede
const centipede = new Centipede();

// Mouse move handler
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Convert mouse position to world coordinates
    mouseWorld.set(mouse.x * 40, mouse.y * 30, 0);
}

// Touch support for mobile
function onTouchMove(event) {
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        mouseWorld.set(mouse.x * 40, mouse.y * 30, 0);
    }
}

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('touchmove', onTouchMove);

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update centipede
    centipede.update(mouseWorld.x, mouseWorld.y);
    
    // Render scene
    renderer.render(scene, camera);
}

// Start animation
animate();