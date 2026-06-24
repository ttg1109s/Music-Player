/**
 * Visual RUBIK — khối Rubik 3x3x3 chiếu phối cảnh thủ công (không dùng Three.js), tự xoay theo
 * nhạc và thực hiện các lượt xoay lớp ngẫu nhiên khi năng lượng nhạc đủ cao. Logic gốc giữ
 * nguyên 1:1 (chiếu 3D, sắp xếp theo z, tô màu mặt + viền glow).
 */
        function drawRubik(ctx, perf, isPlaying) {
            rubikRotY += (isPlaying ? 0.01 + smoothedEnergy * 0.05 : 0.005); rubikRotX += (isPlaying ? 0.005 + smoothedEnergy * 0.02 : 0.002);
            if (!rubikAnim.active && smoothedEnergy > 0.4 && isPlaying && Math.random() > 0.9) {
                const axes = ['x', 'y', 'z']; rubikAnim.axis = axes[Math.floor(Math.random() * 3)];
                rubikAnim.layer = Math.floor(Math.random() * 3) - 1; rubikAnim.dir = Math.random() > 0.5 ? 1 : -1; rubikAnim.angle = 0; rubikAnim.active = true;
            }
            if (rubikAnim.active) { rubikAnim.angle += 0.08 * (1 + smoothedEnergy * 2); if (rubikAnim.angle >= Math.PI / 2) { rubikAnim.angle = Math.PI / 2; rotateRubikIndices(rubikAnim.axis, rubikAnim.layer, rubikAnim.dir); rubikAnim.active = false; rubikAnim.angle = 0; } }
            const cubeSize = Math.min(canvas.width, canvas.height) * 0.08; const spacing = cubeSize * 1.05; const viewDist = cubeSize * 25; const fov = cubeSize * 18; 
            const unitVertices = [{x:-0.5,y:-0.5,z:-0.5}, {x:0.5,y:-0.5,z:-0.5}, {x:0.5,y:0.5,z:-0.5}, {x:-0.5,y:0.5,z:-0.5}, {x:-0.5,y:-0.5,z:0.5}, {x:0.5,y:-0.5,z:0.5}, {x:0.5,y:0.5,z:0.5}, {x:-0.5,y:0.5,z:0.5}];
            const faces = [ [0,1,2,3], [1,5,6,2], [5,4,7,6], [4,0,3,7], [3,2,6,7], [4,5,1,0] ]; let drawnCubes = [];
            const centerX = canvas.width / 2, centerY = canvas.height / 2;
            for(let i=0; i<rubikCubes.length; i++) {
                let rc = rubikCubes[i]; let val = vizDataArray[rc.binIdx * 4] || 0; let scaleBounce = 1 + (val / 255) * 0.4; let extraDist = (val / 255) * cubeSize * 1.2 * (isPlaying ? 1 : 0); 
                let lx = rc.cx * spacing + Math.sign(rc.cx) * extraDist; let ly = rc.cy * spacing + Math.sign(rc.cy) * extraDist; let lz = rc.cz * spacing + Math.sign(rc.cz) * extraDist; let pos = {x: lx, y: ly, z: lz};
                if (rubikAnim.active && rc['c' + rubikAnim.axis] === rubikAnim.layer) {
                    let currentRot = rubikAnim.angle * rubikAnim.dir;
                    if (rubikAnim.axis === 'x') pos = rotate3D(pos, currentRot, 0, 0); if (rubikAnim.axis === 'y') pos = rotate3D(pos, 0, currentRot, 0); if (rubikAnim.axis === 'z') pos = rotate3D(pos, 0, 0, currentRot);
                }
                let cCenter = rotate3D(pos, rubikRotX, rubikRotY, 0); drawnCubes.push({ rc: rc, centerZ: cCenter.z, val: val, pos: pos, scale: scaleBounce });
            }
            drawnCubes.sort((a, b) => b.centerZ - a.centerZ); 
            for(let i=0; i<drawnCubes.length; i++) {
                let c = drawnCubes[i]; let colors = getComputedColor(c.rc.binIdx, 27, c.val); let projVerts = []; 
                for(let v=0; v<8; v++) {
                    let uv = unitVertices[v]; let vx = c.pos.x + uv.x * cubeSize * c.scale; let vy = c.pos.y + uv.y * cubeSize * c.scale; let vz = c.pos.z + uv.z * cubeSize * c.scale; let vertPos = {x: vx, y: vy, z: vz};
                    if (rubikAnim.active && c.rc['c' + rubikAnim.axis] === rubikAnim.layer) {
                        let currentRot = rubikAnim.angle * rubikAnim.dir; vertPos.x -= c.pos.x; vertPos.y -= c.pos.y; vertPos.z -= c.pos.z;
                        if (rubikAnim.axis === 'x') vertPos = rotate3D(vertPos, currentRot, 0, 0); if (rubikAnim.axis === 'y') vertPos = rotate3D(vertPos, 0, currentRot, 0); if (rubikAnim.axis === 'z') vertPos = rotate3D(vertPos, 0, 0, currentRot);
                        vertPos.x += c.pos.x; vertPos.y += c.pos.y; vertPos.z += c.pos.z;
                    }
                    let rotV = rotate3D(vertPos, rubikRotX, rubikRotY, 0); projVerts.push(project3D(rotV, fov, viewDist, centerX, centerY));
                }
                ctx.lineWidth = 1.5 * dpr; ctx.lineJoin = 'round';
                for(let f=0; f<6; f++) {
                    let face = faces[f]; let p0 = projVerts[face[0]], p1 = projVerts[face[1]], p2 = projVerts[face[2]];
                    let dx1 = p1.x - p0.x, dy1 = p1.y - p0.y; let dx2 = p2.x - p1.x, dy2 = p2.y - p1.y; let crossZ = dx1 * dy2 - dy1 * dx2;
                    if (crossZ > 0) { 
                        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); for(let vIdx=1; vIdx<4; vIdx++) ctx.lineTo(projVerts[face[vIdx]].x, projVerts[face[vIdx]].y); ctx.closePath();
                        let lightFactor = 0.5 + (f * 0.1); ctx.fillStyle = colors.fill; ctx.globalAlpha = 0.8 * lightFactor; ctx.fill(); ctx.globalAlpha = 1.0; ctx.strokeStyle = vizConfig.bgColor; ctx.stroke();
                    }
                }
                if (c.val > 200 && perf.blurMult > 0) {
                    ctx.shadowBlur = 15 * dpr * perf.blurMult; ctx.shadowColor = colors.glow;
                    for(let f=0; f<6; f++) {
                        let face = faces[f]; let p0 = projVerts[face[0]], p1 = projVerts[face[1]], p2 = projVerts[face[2]];
                        let crossZ = (p1.x - p0.x)*(p2.y - p1.y) - (p1.y - p0.y)*(p2.x - p1.x);
                        if(crossZ > 0) { ctx.beginPath(); ctx.moveTo(p0.x, p0.y); for(let vIdx=1; vIdx<4; vIdx++) ctx.lineTo(projVerts[face[vIdx]].x, projVerts[face[vIdx]].y); ctx.closePath(); ctx.strokeStyle = colors.glow; ctx.stroke(); }
                    }
                    ctx.shadowBlur = 0;
                }
            }
        }
