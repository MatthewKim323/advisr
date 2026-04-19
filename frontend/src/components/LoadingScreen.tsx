import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const BUFFER_A_FRAG = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;
out vec4 fragColor;

#define SF 1./min(iResolution.x,iResolution.y)
#define PI 3.14159265359

mat2 rot(float a){
    float ca = cos(a);
    float sa = sin(a);
    return mat2(ca,-sa,sa,ca);
}
void main()
{    
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;
    vec2 ouv = fragCoord/iResolution.xy;
    
    vec3 pPoses[6];
    pPoses[0] = vec3(.25, .25, .05);
    pPoses[1] = vec3(-.15, .13, .08);
    pPoses[2] = vec3(.12, -.20, .1);
    pPoses[3] = vec3(.28, -.30, .13);
    pPoses[4] = vec3(.05, .3, .18);
    pPoses[5] = vec3(-.3, -.3, .3);
    
    float p = 0.;
    for(int i=0; i<6; i++){
        vec3 pd = pPoses[i];
        p += smoothstep(pd.z, .0, length(uv - pd.xy));
    }        
    
    // Rotation speed calculated to complete 2*PI in exactly 2.5 seconds
    // Speed = 2*PI / 2.5 = 2.51327
    float rotationSpeed = (2.0 * PI) / 2.5;
    vec2 rotUv = uv * rot(iTime * rotationSpeed);
            
    float m = smoothstep(.025, 0., abs(rotUv.y)) * smoothstep(0., .1, rotUv.x) * smoothstep(.51, .49, rotUv.x);       
    
    vec3 backCol = texture(iChannel0, ouv).rgb*(p >0. ? min(.9+p*.1, 0.99) : .9);
    
    vec3 col = mix(backCol, vec3(0.05, 0.45, 0.55), m);
    
    fragColor = vec4(col,1.0);
}
`;

const IMAGE_FRAG = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;
out vec4 fragColor;

#define SF 1./min(iResolution.x,iResolution.y)
void main()
{
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 ouv = fragCoord/iResolution.xy;
    vec2 uv = (fragCoord - .5*iResolution.xy)/iResolution.y;    
        
    vec3 activeCol = texture(iChannel0, ouv).rgb;
    
    float l = length(uv);
    
    float m = 0.;
    
    float i = .15*round(l/.15);
    m += smoothstep(SF*2., 0., abs(i-l));            
    m += smoothstep(SF, 0., abs(SF-uv.x));   
    m += smoothstep(SF, 0., abs(SF-uv.y));    
    
    vec3 col = activeCol + vec3(0.05, 0.35, 0.45) * m;
    col *= step(l, .51);
    
    fragColor = vec4(col, 1.);
}
`;

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // We want 1 rotation to take exactly 2.5 seconds
    // Fade lasts 1 second, so start fade at 1.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500); // 1.5s delay + 1s fade = 2.5s total

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  useEffect(() => {
    // Remove the early return so rendering continues during exit transition
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error('WebGL 2.0 not supported');
      return;
    }

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const createProgram = (vsSource: string, fsSource: string) => {
      const vs = compileShader(vsSource, gl.VERTEX_SHADER);
      const fs = compileShader(fsSource, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return null;

      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    const bufferAProgram = createProgram(VERTEX_SHADER, BUFFER_A_FRAG);
    const imageProgram = createProgram(VERTEX_SHADER, IMAGE_FRAG);

    if (!bufferAProgram || !imageProgram) return;

    const positionAttributeA = gl.getAttribLocation(bufferAProgram, 'position');
    const positionAttributeI = gl.getAttribLocation(imageProgram, 'position');

    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Framebuffer setup for Buffer A ping-pong
    const createTexture = (width: number, height: number) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };

    const createFramebuffer = (texture: WebGLTexture) => {
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      return fbo;
    };

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    let texA1 = createTexture(width, height)!;
    let texA2 = createTexture(width, height)!;
    let fboA1 = createFramebuffer(texA1)!;
    let fboA2 = createFramebuffer(texA2)!;

    let currentTexture = texA1;
    let previousTexture = texA2;
    let currentFbo = fboA1;

    let animationId: number;
    let startTime = performance.now();

    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      // Handle Resize
      if (canvas.clientWidth !== width || canvas.clientHeight !== height) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Re-create textures/FBOs on resize (oversimplified but functional)
        gl.deleteTexture(texA1);
        gl.deleteTexture(texA2);
        gl.deleteFramebuffer(fboA1);
        gl.deleteFramebuffer(fboA2);
        
        texA1 = createTexture(width, height)!;
        texA2 = createTexture(width, height)!;
        fboA1 = createFramebuffer(texA1)!;
        fboA2 = createFramebuffer(texA2)!;
        
        currentTexture = texA1;
        previousTexture = texA2;
        currentFbo = fboA1;
      }

      gl.viewport(0, 0, width, height);

      // Pass 1: Buffer A
      gl.useProgram(bufferAProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, currentFbo);
      gl.uniform2f(gl.getUniformLocation(bufferAProgram, 'iResolution'), width, height);
      gl.uniform1f(gl.getUniformLocation(bufferAProgram, 'iTime'), elapsed);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, previousTexture);
      gl.uniform1i(gl.getUniformLocation(bufferAProgram, 'iChannel0'), 0);

      gl.enableVertexAttribArray(positionAttributeA);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeA, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Pass 2: Image
      gl.useProgram(imageProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.uniform2f(gl.getUniformLocation(imageProgram, 'iResolution'), width, height);
      gl.uniform1f(gl.getUniformLocation(imageProgram, 'iTime'), elapsed);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.uniform1i(gl.getUniformLocation(imageProgram, 'iChannel0'), 0);

      gl.enableVertexAttribArray(positionAttributeI);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeI, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Swap
      [currentTexture, previousTexture] = [previousTexture, currentTexture];
      currentFbo = (currentFbo === fboA1) ? fboA2 : fboA1;

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      gl.deleteProgram(bufferAProgram);
      gl.deleteProgram(imageProgram);
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texA1);
      gl.deleteTexture(texA2);
      gl.deleteFramebuffer(fboA1);
      gl.deleteFramebuffer(fboA2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: '#080E1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100vw',
              height: '100vh',
              display: 'block'
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
