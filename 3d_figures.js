var projectionMatrix;

var shaderProgram, shaderVertexPositionAttribute, shaderVertexColorAttribute, 
    shaderProjectionMatrixUniform, shaderModelViewMatrixUniform;

var duration = 5000; // ms

// Attributes: Input variables used in the vertex shader. Since the vertex shader is called on each vertex, these will be different every time the vertex shader is invoked.
// Uniforms: Input variables for both the vertex and fragment shaders. These do not change values from vertex to vertex.
// Varyings: Used for passing data from the vertex shader to the fragment shader. Represent information for which the shader can output different value for each vertex.
var vertexShaderSource =    
    "    attribute vec3 vertexPos;\n" +
    "    attribute vec4 vertexColor;\n" +
    "    uniform mat4 modelViewMatrix;\n" +
    "    uniform mat4 projectionMatrix;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "		// Return the transformed and projected vertex value\n" +
    "        gl_Position = projectionMatrix * modelViewMatrix * \n" +
    "            vec4(vertexPos, 1.0);\n" +
    "        // Output the vertexColor in vColor\n" +
    "        vColor = vertexColor;\n" +
    "    }\n";

// precision lowp float
// This determines how much precision the GPU uses when calculating floats. The use of highp depends on the system.
// - highp for vertex positions,
// - mediump for texture coordinates,
// - lowp for colors.
var fragmentShaderSource = 
    "    precision lowp float;\n" +
    "    varying vec4 vColor;\n" +
    "    void main(void) {\n" +
    "    gl_FragColor = vColor;\n" +
    "}\n";

function initWebGL(canvas)
{
    var gl = null;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try 
    {
        gl = canvas.getContext("experimental-webgl");
    } 
    catch (e)
    {
        msg = "Error creating WebGL Context!: " + e.toString();
    }

    if (!gl)
    {
        alert(msg);
        throw new Error(msg);
    }

    return gl;        
 }

function initViewport(gl, canvas)
{
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function initGL(canvas)
{
    // Create a project matrix with 45 degree field of view
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 1, 10000);
}

// TO DO: Create the functions for each of the figures.

function createShader(gl, str, type)
{
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShader(gl)
{
    // load and compile the fragment and vertex shader
    var fragmentShader = createShader(gl, fragmentShaderSource, "fragment");
    var vertexShader = createShader(gl, vertexShaderSource, "vertex");

    // link them together into a new program
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // get pointers to the shader params
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);

    shaderVertexColorAttribute = gl.getAttribLocation(shaderProgram, "vertexColor");
    gl.enableVertexAttribArray(shaderVertexColorAttribute);
    
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, objs) 
{
    // clear the background (with black)
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT);

    // set the shader to use
    gl.useProgram(shaderProgram);

    for(i = 0; i<objs.length; i++)
    {
        obj = objs[i];
        // connect up the shader parameters: vertex position, color and projection/model matrices
        // set up the buffers
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
        gl.vertexAttribPointer(shaderVertexPositionAttribute, obj.vertSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, obj.colorBuffer);
        gl.vertexAttribPointer(shaderVertexColorAttribute, obj.colorSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.indices);

        gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false, projectionMatrix);
        gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false, obj.modelViewMatrix);

        // Draw the object's primitives using indexed buffer information.
        // void gl.drawElements(mode, count, type, offset);
        // mode: A GLenum specifying the type primitive to render.
        // count: A GLsizei specifying the number of elements to be rendered.
        // type: A GLenum specifying the type of the values in the element array buffer.
        // offset: A GLintptr specifying an offset in the element array buffer.
        gl.drawElements(obj.primtype, obj.nIndices, gl.UNSIGNED_SHORT, 0);
    }
}

function run(gl, objs) 
{
    // The window.requestAnimationFrame() method tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation before the next repaint. The method takes a callback as an argument to be invoked before the repaint.
    requestAnimationFrame(function() { run(gl, objs); });
    draw(gl, objs);

    for(i = 0; i<objs.length; i++)
        objs[i].update();
}

var colors = [
    [1.0, 0.0, 0.0, 1.0], // Red
    [0.0, 1.0, 0.0, 1.0], // Green
    [0.0, 0.0, 1.0, 1.0], // Blue
    [1.0, 1.0, 0.0, 1.0], // Yellow
    [1.0, 0.0, 1.0, 1.0], // Cyan
    [0.0, 1.0, 1.0, 1.0], // Magenta

];

function makePyr(gl, translation, rotationAxis){
    var verts = [
        0.0,  1.0,  0.0,
        1.0, -1.0, 0.0,
        0.30901699437494745, -1.0, 0.9510565162951535,
        -0.8090169943749473, -1.0, 0.5877852522924732,
        -0.8090169943749475, -1.0, -0.587785252292473,
        0.30901699437494723, -1.0, -0.9510565162951536,
        0.0, -1.0,  0.0,
    ];
    var pyramidIndices = [
        0, 1, 2, // T1
        0, 2, 3, // T2
        0, 3, 4, // T3
        0, 4, 5, // T4
        0, 5, 1, // T5

        6, 1, 2, // B1
        6, 2, 3, // B2
        6, 3, 4, // B3
        6, 4, 5, // B4
        6, 5, 1, // B5
    ];

    var colorIndices = [
        0, 1, 2, 3, 4, 5, 5, 5, 5, 5
    ];

    return makeFigure(gl, verts, pyramidIndices, colors, colorIndices, translation, rotationAxis);
}

function makeOcta(gl, translation, rotationAxis){
    var verts = [
         1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
         0.0,  1.0,  0.0,
         0.0, -1.0,  0.0,
         0.0,  0.0,  1.0,
         0.0,  0.0, -1.0
    ];
    var indices = [
        0, 2, 5,
        0, 5, 3,
        0, 3, 4,
        0, 4, 2,

        1, 2, 5,
        1, 5, 3,
        1, 3, 4,
        1, 4, 2,
    ];

    var colorIndices = [
        0, 1, 2, 3, 2, 3, 0, 1
    ];

    var octa = makeFigure(gl, verts, indices, colors, colorIndices, translation, rotationAxis);

    octa.update = function(){
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);

        var currY = this.modelViewMatrix[13];
        var targetY = Math.sin(0.005 * now);

        var pos = [ 0, targetY - currY, 0];
        mat4.translate(this.modelViewMatrix, this.modelViewMatrix, pos);
        
    }
    return octa;
}

function makeScutoid(gl, translation, rotationAxis){
    var verts = [
        // Bottom pentagon
        1.0, -1.0, 0.0,                                 // 0
        0.30901699437494745, -1.0, 0.9510565162951535,  // 1
        -0.8090169943749473, -1.0, 0.5877852522924732,  // 2
        -0.8090169943749475, -1.0, -0.587785252292473,  // 3
        0.30901699437494723, -1.0, -0.9510565162951536, // 4

        // Top Hexagon
        0.8660254037844387, 1.0, 0.5,                   // 5
        0.0, 1.0, 1.0,                                  // 6
        -0.8660254037844387, 1.0, 0.5,                  // 7
        -0.8660254037844386, 1.0, -0.5,                 // 8
        0.0, 1.0, -1.0,                                 // 9
        0.8660254037844384, 1.0, -0.5,                  // 10

        // Extra point
        1, 0.0, 0                                       // 11
    ];

    var indices = [
        // Pentagon
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        // Hexagon
        5, 6, 7,
        5, 7, 8,
        5, 8, 10,
        10, 8, 9,
        // Triangle
        5, 10, 11,
        // Back
        2, 7, 8,
        2, 8, 3,
        // Side 1
        2, 1, 6,
        2, 6, 7,
        // Side 2
        3, 8, 9,
        3, 4, 9,
        // Front 1
        10, 9, 4,
        10, 4, 0,
        10, 0, 11,
        // Front 2
        5, 1, 6,
        5, 0, 1,
        5, 0, 11
    ];

    var colorIndices = [
        // Pentagon
        0, 0, 0,
        // Hexagon
        0, 0, 0, 0,
        // Triangle
        1,
        // Back
        1, 1,
        // Side 1
        5, 5,
        // Side 2
        2, 2,
        // Front 1
        4, 4, 4,
        // Front 2
        2, 2, 2
    ];
    return makeFigure(gl, verts, indices, colors, colorIndices, translation, rotationAxis);
}

function makeFigure(gl, verts, indices, colorList, colorIndices, translation, rotationAxis){

    var allVerts = [];
    for(var index in indices){
        allVerts.push(verts[indices[index]*3 + 0]);
        allVerts.push(verts[indices[index]*3 + 1]);
        allVerts.push(verts[indices[index]*3 + 2]);
    }

    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(allVerts), gl.STATIC_DRAW);

    var vertexColors = [];
    for(var indx in colorIndices){
        for( var i = 0; i < 3; i++)
            vertexColors = vertexColors.concat(colorList[colorIndices[indx]]);
    }

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);


    var figureIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, figureIndexBuffer);
    var figureIndices = [];
    for (var num = 0; num < allVerts.length/3; num++){
        figureIndices.push(Number(num));
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(figureIndices), gl.STATIC_DRAW);

    var figure = {
        buffer: vertexBuffer,
        colorBuffer: colorBuffer,
        indices: figureIndexBuffer,
        vertSize: 3,
        nVerts: (allVerts.length)/3,
        colorSize: 4,
        nColors: (colorBuffer.length)/4,
        nIndices: figureIndices.length,
        primtype:gl.TRIANGLES,
        modelViewMatrix: mat4.create(), 
        currentTime : Date.now()
    };

    mat4.translate(figure.modelViewMatrix, figure.modelViewMatrix, translation);

    figure.update = function(){
        var now = Date.now();
        var deltat = now - this.currentTime;
        this.currentTime = now;
        var fract = deltat / duration;
        var angle = Math.PI * 2 * fract;
    
        // Rotates a mat4 by the given angle
        // mat4 out the receiving matrix
        // mat4 a the matrix to rotate
        // Number rad the angle to rotate the matrix by
        // vec3 axis the axis to rotate around
        mat4.rotate(this.modelViewMatrix, this.modelViewMatrix, angle, rotationAxis);
    }

    return figure;
}
