/**
 * Toán học 3D dùng cho hiệu ứng Rubik's Cube (xoay, chiếu phối cảnh, hoán vị các khối lập phương).
 * (Trích từ file gốc, dòng 1066-1083 trong khối <script>)
 */
        function rotate3D(point, rx, ry, rz) {
            let y1 = point.y * Math.cos(rx) - point.z * Math.sin(rx); let z1 = point.y * Math.sin(rx) + point.z * Math.cos(rx);
            let x2 = point.x * Math.cos(ry) + z1 * Math.sin(ry); let z2 = -point.x * Math.sin(ry) + z1 * Math.cos(ry);
            let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz); let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
            return { x: x3, y: y3, z: z2 };
        }
        function project3D(p, fov, viewDist, cx, cy) { let factor = fov / (viewDist + p.z); return { x: p.x * factor + cx, y: p.y * factor + cy, z: p.z }; }
        function rotateRubikIndices(axis, layer, dir) {
            rubikCubes.forEach(rc => {
                if (rc['c' + axis] === layer) {
                    let tempX = rc.cx, tempY = rc.cy, tempZ = rc.cz;
                    if (axis === 'x') { rc.cy = dir > 0 ? -tempZ : tempZ; rc.cz = dir > 0 ? tempY : -tempY; } 
                    else if (axis === 'y') { rc.cx = dir > 0 ? tempZ : -tempZ; rc.cz = dir > 0 ? -tempX : tempX; } 
                    else if (axis === 'z') { rc.cx = dir > 0 ? -tempY : tempY; rc.cy = dir > 0 ? tempX : -tempX; }
                }
            });
        }

