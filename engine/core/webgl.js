// Module webgl

webvn.add('webgl', ['class'], function (s, kclass) {

var webgl = {};

webgl.create = function (v, type) {

    switch (type) {
        case '2d':
            return new webgl.WebGL2D(v);
            break;
        default:
            break;
    }

};

var vec3 = {
    length: function(pt) {

        return Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1] + pt[2] * pt[2]);

    },
    normalize: function(pt) {

        var d = Math.sqrt((pt[0] * pt[0]) + (pt[1] * pt[1]) + (pt[2] * pt[2]));
        if (d === 0) {
            return [0, 0, 0];
        }
        return [pt[0] / d, pt[1] / d, pt[2] / d];

    },
    dot: function(v1, v2) {

        return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];

    },
    angle: function(v1, v2) {

        return Math.acos((v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]) / (Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1] + v1[2] * v1[2]) * Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1] + v2[2] * v2[2])));

    },
    cross: function(vectA, vectB) {

        return [vectA[1] * vectB[2] - vectB[1] * vectA[2], vectA[2] * vectB[0] - vectB[2] * vectA[0], vectA[0] * vectB[1] - vectB[0] * vectA[1]];

    },
    multiply: function(vectA, constB) {

        return [vectA[0] * constB, vectA[1] * constB, vectA[2] * constB];

    },
    add: function(vectA, vectB) {

        return [vectA[0] + vectB[0], vectA[1] + vectB[1], vectA[2] + vectB[2]];

    },
    subtract: function(vectA, vectB) {

        return [vectA[0] - vectB[0], vectA[1] - vectB[1], vectA[2] - vectB[2]];

    },
    equal: function(a, b) {

        var epsilon = 0.0000001;
        if ((a === undefined) && (b === undefined)) {
            return true;
        }
        if ((a === undefined) || (b === undefined)) {
            return false;
        }

        return (Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon && Math.abs(a[2] - b[2]) < epsilon);

    }
};

var mat3 = {
    identity: [1.0, 0.0, 0.0,
               0.0, 1.0, 0.0,
               0.0, 0.0, 1.0],
    multiply: function (m1, m2) {

        var m10 = m1[0], m11 = m1[1], m12 = m1[2], m13 = m1[3], m14 = m1[4], m15 = m1[5], m16 = m1[6], m17 = m1[7], m18 = m1[8],
            m20 = m2[0], m21 = m2[1], m22 = m2[2], m23 = m2[3], m24 = m2[4], m25 = m2[5], m26 = m2[6], m27 = m2[7], m28 = m2[8];

        m2[0] = m20 * m10 + m23 * m11 + m26 * m12;
        m2[1] = m21 * m10 + m24 * m11 + m27 * m12;
        m2[2] = m22 * m10 + m25 * m11 + m28 * m12;
        m2[3] = m20 * m13 + m23 * m14 + m26 * m15;
        m2[4] = m21 * m13 + m24 * m14 + m27 * m15;
        m2[5] = m22 * m13 + m25 * m14 + m28 * m15;
        m2[6] = m20 * m16 + m23 * m17 + m26 * m18;
        m2[7] = m21 * m16 + m24 * m17 + m27 * m18;
        m2[8] = m22 * m16 + m25 * m17 + m28 * m18;

    },
    vec2_multiply: function (m1, m2) {
        
        var mOut = [];
        mOut[0] = m2[0] * m1[0] + m2[3] * m1[1] + m2[6];
        mOut[1] = m2[1] * m1[0] + m2[4] * m1[1] + m2[7];

        return mOut;

    },
    transpose: function (m) {

        return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];

    }
};

var STACK_DEPTH_LIMIT = 16;

var Transform = webgl.Transform = kclass.create({
    constructor: function Transform(mat) {

        return this.clearStack(mat);

    },
    clearStack: function(init_mat) {

        this.m_stack = [];
        this.m_cache = [];
        this.c_stack = 0;
        this.valid = 0;
        this.result = null;

        for (var i = 0; i < STACK_DEPTH_LIMIT; i++) {
            this.m_stack[i] = this.getIdentity();
        }

        if (init_mat !== undefined) {
            this.m_stack[0] = init_mat;
        } else {
            this.setIdentity();
        }

    },
    getIdentity: function() {

        return [1.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 0.0, 1.0];

    },
    getResult: function() {

        if (!this.c_stack) {
            return this.m_stack[0];
        }

        var m = mat3.identity;

        if (this.valid > this.c_stack-1) { this.valid = this.c_stack-1; }

        for (var i = this.valid; i < this.c_stack+1; i++) {
            m = mat3.multiply(this.m_stack[i],m);
            this.m_cache[i] = m;
        }

        this.valid = this.c_stack-1;

        this.result = this.m_cache[this.c_stack];

        return this.result;

    },
    popMatrix: function() {

        if (this.c_stack === 0) { 
            return; 
        }
        this.c_stack--;

    },
    pushMatrix: function() {

        this.c_stack++;
        this.m_stack[this.c_stack] = this.getIdentity();

    },
    scale: function(x, y) {

        var scaleMatrix = this.getIdentity();

        scaleMatrix[0] = x;
        scaleMatrix[4] = y;

        mat3.multiply(scaleMatrix, this.m_stack[this.c_stack]);

    },
    setIdentity: function() {

        this.m_stack[this.c_stack] = this.getIdentity();
        if (this.valid === this.c_stack && this.c_stack) {
            this.valid--;
        }

    },
    translate: function(x, y) {

        var translateMatrix = this.getIdentity();

        translateMatrix[6] = x;
        translateMatrix[7] = y;

        mat3.multiply(translateMatrix, this.m_stack[this.c_stack]);

    }
});

/* 2d webgl functions
 * Inspired by webgl-2d
 */
var WebGL2D = webgl.WebGL2D = kclass.create({
    constructor: function WebGL2D(v) {

        this.view = v;
        this.gl = v.getContext('webgl');
        this.width = v.width;
        this.height = v.height;
        this.fs = undefined;
        this.vs = undefined;
        this.transform = new Transform();
        this.maxTextureSize = undefined;
        this.shaderPool = [];

        this.init();

    },
    clear: function () {

        var gl = this.gl;

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

    },
    createProgram: function () {

        var gl = this.gl,
            program = gl.createProgram();

        gl.attachShader(program, this.vertexShader);
        gl.attachShader(program, this.fragmentShader);
        gl.linkProgram(program);

        return program;

    },
    drawImage: function (image, x, y) {

        var gl = this.gl;

        var transform = this.transform,
            sMask = WebGL2D.shaderMask.texture,
            doCrop = false;

        transform.pushMatrix();

        transform.translate(x, y);
        transform.scale(image.width, image.height);

        var sp = this.initShaders(transform.c_stack, sMask);

        var texture, cacheIndex = WebGL2D.imageCache.indexOf(image);

        if (cacheIndex !== -1) {
            texture = WebGL2D.textureCache[cacheIndex];
        } else {
            texture = new WebGL2D.Texture(gl, image);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectVertexPositionBuffer);
        gl.vertexAttribPointer(sp.vertexPositionAttribute, 4, gl.FLOAT, false, 0, 0);

        gl.bindTexture(gl.TEXTURE_2D, texture.obj);
        gl.activeTexture(gl.TEXTURE0);

        gl.uniform1i(sp.uSampler, 0);

        this.sendTransformStack(sp);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        transform.popMatrix();

    },
    getFragmentShaderSource: function (sMask) {

        return [
            '#ifdef GL_ES',
                'precision highp float;',
            '#endif',
            '#define hasTexture ' + ((sMask & WebGL2D.shaderMask.texture) ? '1' : '0'),
            '#define hasCrop ' + ((sMask & WebGL2D.shaderMask.crop) ? '1' : '0'),
            'varying vec4 vColor;',
            '#if hasTexture',
                'varying vec2 vTextureCoord;',
                'uniform sampler2D uSampler;',
                '#if hasCrop',
                    'uniform vec4 uCropSource;',
                '#endif',
            '#endif',
            'void main() {',
                '#if hasTexture',
                    '#if hasCrop',
                        'gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.x * uCropSource.z, vTextureCoord.y * uCropSource.w) + uCropSource.xy);',
                    '#else',
                        'gl_FragColor = texture2D(uSampler, vTextureCoord);',
                    '#endif',
                '#else',
                    'gl_FragColor = vColor;',
                '#endif',
            '}'
        ].join('\n');

    },
    getVertexShaderSource: function (stackDepth, sMask) {

        var w = 2 / this.width, h = -2 / this.height;

        stackDepth = stackDepth || 1;

        return [
            '#define hasTexture ' + ((sMask & WebGL2D.shaderMask.texture) ? '1' : '0'),
            'attribute vec4 aVertexPosition;',
            '#if hasTexture',
            'varying vec2 vTextureCoord;',
            '#endif',
            'uniform vec4 uColor;',
            'uniform mat3 uTransforms[' + stackDepth + '];',
            'varying vec4 vColor;',
            'const mat4 pMatrix = mat4(' + w + ',0,0,0, 0,' + h + ',0,0, 0,0,1.0,1.0, -1.0,1.0,0,0);',
            'mat3 crunchStack() {',
                'mat3 result = uTransforms[0];',
                'for (int i = 1; i < ' + stackDepth + '; i++) {',
                    'result = uTransforms[i] * result;',
                '}',
                'return result;',
            '}',
            'void main() {',
                'vec3 position = crunchStack() * vec3(aVertexPosition.x, aVertexPosition.y, 1.0);',
                'gl_Position = pMatrix * vec4(position, 1.0);',
                'vColor = uColor;',
                '#if hasTexture',
                    'vTextureCoord = aVertexPosition.zw;',
                '#endif',
            '}'
        ].join('\n');

    },
    init: function () {

        var gl = this.gl;

        this.initShaders();
        this.initBuffers();

        gl.viewport(0, 0, this.width, this.height);
        this.clear();

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);

    },
    initBuffers: function () {

        var gl = this.gl;

        this.rectVertexPositionBuffer = gl.createBuffer();
        this.rectVertexColorBuffer = gl.createBuffer();
        this.rectVerts = new Float32Array([
            0, 0, 0, 0,
            0, 1, 0, 1,
            1, 1, 1, 1,
            1, 0, 1, 0
        ]);
        this.pathVertexPositionBuffer = gl.createBuffer();
        this.pathVertexColorBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.rectVertexPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.rectVerts, gl.STATIC_DRAW);

    },
    initShaders: function (transformStackDepth, sMask) {

        var gl = this.gl;

        transformStackDepth = transformStackDepth || 1;
        sMask = sMask || 0;

        var storedShader = this.shaderPool[transformStackDepth];
        if (!storedShader) { 
            storedShader = this.shaderPool[transformStackDepth] = []; 
        }
        storedShader = storedShader[sMask];

        if (storedShader) {
            gl.useProgram(storedShader);
            this.shaderProgram = storedShader;
            return storedShader;
        } else {
            var fs = this.fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(this.fs, this.getFragmentShaderSource(sMask));
            gl.compileShader(this.fs);

            var vs = this.vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(this.vs, this.getVertexShaderSource(transformStackDepth,sMask));
            gl.compileShader(this.vs);

            var shaderProgram = this.shaderProgram = gl.createProgram();
            shaderProgram.stackDepth = transformStackDepth;
            gl.attachShader(shaderProgram, fs);
            gl.attachShader(shaderProgram, vs);
            gl.linkProgram(shaderProgram);
            gl.useProgram(shaderProgram);

            shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

            shaderProgram.uColor   = gl.getUniformLocation(shaderProgram, 'uColor');
            shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');
            shaderProgram.uCropSource = gl.getUniformLocation(shaderProgram, 'uCropSource');

            shaderProgram.uTransforms = [];
            for (var i = 0; i < transformStackDepth; ++i) {
                shaderProgram.uTransforms[i] = gl.getUniformLocation(shaderProgram, 'uTransforms[' + i + ']');
            }
            this.shaderPool[transformStackDepth][sMask] = shaderProgram;
            return shaderProgram;
        }

    },
    sendTransformStack: function (sp) {

        var gl = this.gl;
        var stack = this.transform.m_stack;
        for (var i = 0, maxI = this.transform.c_stack + 1; i < maxI; ++i) {
            gl.uniformMatrix3fv(sp.uTransforms[i], false, stack[maxI-1-i]);
        }

    }
}, {
    shaderMask: {
        texture: 1,
        crop: 2,
        path: 4
    },
    imageCache: [],
    textureCache: [],
    Texture: kclass.create({
        constructor: function Texture(gl, image) {

            this.obj   = gl.createTexture();
            this.index = WebGL2D.textureCache.push(this);

            WebGL2D.imageCache.push(image);

            // we may wish to consider tiling large images like this instead of scaling and
            // adjust appropriately (flip to next texture source and tile offset) when drawing
            if (image.width > this.maxTextureSize || image.height > this.maxTextureSize) {
                var canvas = document.createElement("canvas");

                canvas.width  = (image.width  > this.maxTextureSize) ? this.maxTextureSize : image.width;
                canvas.height = (image.height > this.maxTextureSize) ? this.maxTextureSize : image.height;

                var ctx = canvas.getContext("2d");

                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

                image = canvas;
            }

            gl.bindTexture(gl.TEXTURE_2D, this.obj);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            // Enable Mip mapping on power-of-2 textures
            if (this.isPOT(image.width) && this.isPOT(image.height)) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }

            // Unbind texture
            gl.bindTexture(gl.TEXTURE_2D, null);

        },
        isPOT: function (value) {
            return value > 0 && ((value - 1) & value) === 0;
        }
    })
});

return webgl;

});