'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedVisual() {
  const dataBlockRef = useRef<HTMLPreElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Animated Data Block
    const dataBlock = dataBlockRef.current;
    if (dataBlock) {
      const chars = '0123456789ABCDEF<>+=-_';
      let txt = '';
      for (let i = 0; i < 650; i++) {
        txt += chars[Math.floor(Math.random() * chars.length)];
        if (i % 24 === 23) txt += '\n';
        else if (i % 4 === 3) txt += ' ';
      }
      dataBlock.textContent = txt;

      // Random character animation
      const interval = setInterval(() => {
        const text = dataBlock.textContent;
        if (text) {
          const pos = Math.floor(Math.random() * text.length);
          if (text[pos] !== ' ' && text[pos] !== '\n') {
            const newChar = chars[Math.floor(Math.random() * chars.length)];
            dataBlock.textContent = text.substring(0, pos) + newChar + text.substring(pos + 1);
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    // WebGL Canvas Animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `;

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec2 p = st * 75.0;
        float t = u_time * 0.25;
        float driftX = snoise(st * 1.5 + vec2(t, 0.0)) * 2.5;
        float driftY = snoise(st * 1.5 + vec2(0.0, t * 0.8)) * 2.5;
        
        vec2 dp = p + vec2(driftX, driftY);
        float field = sin(dp.x) * sin(dp.y);
        
        float clusterNoise = snoise(st * 1.8 - t * 0.4);
        float thickness = mix(-0.35, 0.55, clusterNoise);
        
        float aa = 0.05;
        float shape = smoothstep(thickness + aa, thickness - aa, field);

        // Industrial Earth Palette
        vec3 paper = vec3(200.0/255.0, 196.0/255.0, 188.0/255.0); // #c8c4bc
        vec3 ink = vec3(139.0/255.0, 58.0/255.0, 42.0/255.0);     // #8b3a2a

        vec3 finalColor = mix(paper, ink, shape);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");

    function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement | null) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width * window.devicePixelRatio;
      const height = rect.height * window.devicePixelRatio;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        if (gl) {
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
      }
    }

    function render(time: number) {
      time *= 0.001; 
      if (canvas) {
        resizeCanvasToDisplaySize(canvas);
      }
      if (gl) {
        gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
        gl.uniform1f(timeLocation, time);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    return () => {
      // Cleanup WebGL resources if needed
    };
  }, []);

  return (
    <div className="relative w-full h-96 bg-[#c8c4bc] border border-[#8b3a2a] rounded-lg overflow-hidden">
      <div className="absolute top-2 left-2 w-3 h-3 border border-[#8b3a2a] opacity-50 border-r-0 border-b-0"></div>
      <div className="absolute top-2 right-2 w-3 h-3 border border-[#8b3a2a] opacity-50 border-l-0 border-b-0"></div>
      <div className="absolute bottom-2 left-2 w-3 h-3 border border-[#8b3a2a] opacity-50 border-r-0 border-t-0"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border border-[#8b3a2a] opacity-50 border-l-0 border-t-0"></div>
      
      <div className="flex h-full">
        <div className="w-1/4 p-2 border-r border-[#8b3a2a]">
          <pre 
            ref={dataBlockRef}
            className="text-xs font-mono text-[#8b3a2a] opacity-70 leading-tight text-justify select-none"
            style={{ fontSize: '0.7rem', lineHeight: '0.9' }}
          ></pre>
        </div>
        
        <div className="flex-1 relative">
          <canvas 
            ref={canvasRef}
            className="w-full h-full"
          />
        </div>
      </div>
      
      <div className="absolute bottom-2 left-0 right-0 flex justify-between items-center px-4 text-xs font-mono text-[#8b3a2a] opacity-80 border-t border-[#8b3a2a] pt-1">
        <span>SOVEREIGN.OS</span>
        <span>[GENERATIVE VISUAL SYSTEM]</span>
        <span>RENDER: 5.7ms</span>
      </div>
    </div>
  );
}
