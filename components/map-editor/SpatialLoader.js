

function parseTokens(statement) {
    // Regex matches either words/formulas (nouns/links) or arrays of numbers/formulas (specs)
    const tokenRegex = /\[([^\]]+)\]/g;
    const items = [];
    let match;

    while ((match = tokenRegex.exec(statement)) !== null) {
        const rawContent = match[1].trim();

        // 1. Identify Specs: contains commas
        if (rawContent.includes(',')) {
            // Split by comma to get the individual metric strings/formulas
            const specArray = rawContent.split(',').map(s => s.trim());
            items.push({ type: 'specs', value: specArray });
        }
        // 2. Identify Links: starts with an @ sign or contains operators with @
        else if (rawContent.includes('@')) {
            items.push({ type: 'links', value: rawContent });
        }
        // 3. Identify Nouns: everything else (split spaces into an array)
        else {
            const nounArray = rawContent.split(/\s+/).filter(Boolean);
            items.push({ type: 'nouns', value: nounArray });
        }
    }

    return items;
}


function resolveRelativeObject(parsedSequence, absoluteNounCount, activeScene) {
    if (absoluteNounCount <= 0) return null;

    // Get the previous noun token by tracking absolute sequence position
    const nounTokens = parsedSequence.filter(o => o.type === 'nouns');
    const relativeToken = nounTokens[absoluteNounCount - 1];

    if (!relativeToken || !relativeToken.value || relativeToken.value.length === 0) {
        return null;
    }

    let relativeObject = null;
    activeScene.traverse(function (child) {
        if (relativeToken.value.includes(child.name)) {
            relativeObject = child;
        }
    });
    return relativeObject;
}


function createSpatialObject(primaryNoun, nunuClasses, THREE) {
    let geometry, material;
    let createdObject = null;
    const normalizedType = primaryNoun.toLowerCase();

    if (normalizedType.includes('pointlight')) {
        return new THREE.PointLight(0xffffff, 1, 100);
    } else if (normalizedType.includes('directionallight')) {
        return new THREE.DirectionalLight(0xffffff, 1);
    } else if (normalizedType.includes('ambientlight')) {
        return new THREE.AmbientLight(0x404040);
    } else if (normalizedType.includes('spotlight')) {
        return new THREE.SpotLight(0xffffff);
    } else if (normalizedType.includes('audiolistener')) {
        return new THREE.AudioListener();
    } else if (normalizedType.includes('gridhelper')) {
        return new THREE.GridHelper(10, 10);
    } else if (normalizedType.includes('axeshelper')) {
        return new THREE.AxesHelper(5);
    } else if (normalizedType.includes('arrowhelper')) {
        const dir = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 0, 0);
        return new THREE.ArrowHelper(dir, origin, 1, 0xffff00);
    }

    if (normalizedType.includes('cylinder')) {
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
    } else if (normalizedType.includes('sphere')) {
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
    } else if (normalizedType.includes('plane')) {
        geometry = new THREE.PlaneGeometry(1, 1);
    } else if (normalizedType.includes('circle')) {
        geometry = new THREE.CircleGeometry(0.5, 16);
    } else if (normalizedType.includes('torus')) {
        geometry = new THREE.TorusGeometry(0.5, 0.2, 8, 24);
    } else if (normalizedType.includes('cone')) {
        geometry = new THREE.ConeGeometry(0.5, 1, 16);
    } else {
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    if (normalizedType.includes('basic')) {
        material = new THREE.MeshBasicMaterial({ color: 0xAEB2F8 });
    } else if (normalizedType.includes('phong')) {
        material = new THREE.MeshPhongMaterial({ color: 0xAEB2F8 });
    } else {
        material = new nunuClasses.Material({
            color: 0xAEB2F8,
            roughness: 0.4
        });
    }

    return new nunuClasses.Mesh(geometry, material);
}


function evaluateSpatialFormula(expr, currentIdxValue) {
    let cleanExpr = expr.replace(/@idx/g, currentIdxValue);
    // Added both fw and fd metrics to prevent fallback failures
    const fw = 2.0;
    const fd = 1.5;
    try {
        return Function(`"use strict"; const fw = ${fw}; const fd = ${fd}; return (${cleanExpr})`)();
    } catch (e) {
        return parseFloat(cleanExpr) || 0;
    }
}


async function parseSpatialCommands(inputStr, currentIdxValue = 0) {
    const THREE = require('three');
    const parsedSequence = parseTokens(inputStr);
    const activeScene = window.Nunu.getScene();

    let lastNouns = null;
    let defaultSpec = ["0", "0", "0", "0", "0", "0", "0"];
    let nounTokenCount = 0; // Tracks the total observed sequential noun tokens

    for (let i = 0; i < parsedSequence.length; i++) {
        const token = parsedSequence[i];

        if (token.type === 'nouns') {
            lastNouns = token.value;
            nounTokenCount++;
        }

        else if (token.type === 'specs') {
            const specValues = token.value;
            const activeSpec = (specValues && specValues.length >= 6) ? specValues : defaultSpec;
            const primaryNoun = (lastNouns && lastNouns.length > 0) ? lastNouns[lastNouns.length - 1] : "cube";

            let targetObject = null;
            let relativeObject = null;

            // Resolve context index targets relative to current token sequence positions
            const hasIndexToken = activeSpec.some(val => val.includes('@idx')) || primaryNoun.includes('@idx');
            if (hasIndexToken) {
                relativeObject = resolveRelativeObject(parsedSequence, nounTokenCount - 1, activeScene);
            }

            if (lastNouns && lastNouns.length > 0) {
                const searchName = primaryNoun.replace('@idx', currentIdxValue);
                activeScene.traverse(function (child) {
                    if (child.name === searchName) {
                        targetObject = child;
                    }
                });
            }

            if (!targetObject) {
                const nunuClasses = THREE.resolveNunuClasses();
                targetObject = createSpatialObject(primaryNoun, nunuClasses, THREE);
                targetObject.name = primaryNoun.replace('@idx', currentIdxValue);

                window.Nunu.addObject(targetObject, activeScene);

                applyTransformations(targetObject, activeSpec, currentIdxValue, relativeObject);
                currentIdxValue++;
            } else {
                applyTransformations(targetObject, activeSpec, currentIdxValue, relativeObject);
            }

            window.Nunu.gui.updateInterface();
        }
    }
}



//parseSpatialCommands('[elephant][0,0,0,0,0,0,1] [red][0,0,0,0,0,0,1] [balloon][fw*@idx,fd*@idx,0,0,0,0,1]')

function applyTransformations(targetObject, activeSpec, indexContext, relativeObject) {
    // Evaluate positions passing the corresponding spatial axis tag
    const posX = evaluateSpatialFormula(activeSpec[0], indexContext, relativeObject, 'x');
    const posY = evaluateSpatialFormula(activeSpec[1], indexContext, relativeObject, 'y');
    const posZ = evaluateSpatialFormula(activeSpec[2], indexContext, relativeObject, 'z');

    targetObject.position.set(posX, posY, posZ);

    // Evaluate rotations (mapping fallback anchors to rotation axes if needed)
    if (activeSpec.length >= 6) {
        const rotX = evaluateSpatialFormula(activeSpec[3], indexContext, relativeObject, 'x');
        const rotY = evaluateSpatialFormula(activeSpec[4], indexContext, relativeObject, 'y');
        const rotZ = evaluateSpatialFormula(activeSpec[5], indexContext, relativeObject, 'z');

        targetObject.rotation.set(rotX, rotY, rotZ);
    }
}



function evaluateSpatialFormula(expr, indexContext, relativeObject, axis) {
    let baseCoordinate = 0;
    if (relativeObject && relativeObject.position) {
        baseCoordinate = relativeObject.position[axis] || 0;
    }

    let fw = 1.0;
    let fd = 1.0;
    let currentAxisDimension = 1.0;

    if (relativeObject) {
        const THREE = require('three');
        relativeObject.updateMatrixWorld(true);
        if (relativeObject.geometry) {
            relativeObject.geometry.computeBoundingBox();
        }

        const box = new THREE.Box3().setFromObject(relativeObject);
        const size = new THREE.Vector3();
        box.getSize(size);

        fw = size.x !== 0 ? size.x : 1.0;
        fd = size.z !== 0 ? size.z : 1.0;

        if (axis === 'x') currentAxisDimension = fw;
        else if (axis === 'z') currentAxisDimension = fd;
        else currentAxisDimension = (size.y !== 0) ? size.y : 1.0;
    }

    let cleanExpr = expr.trim();

    // Contextual implicit check: If the formula starts with variable shorthand notation,
    // stack the previous base coordinate accumulation calculation to the front.
    // TODO: handle all edge cases and ordering, THIS WON'T ALWAYS BE TRUE!
    if (cleanExpr.startsWith('fw') || cleanExpr.startsWith('fd') || cleanExpr.startsWith('@idx')) {
        cleanExpr = `@0 + ${cleanExpr}`;
    }

    // Centralized safe string substitution mapping
    cleanExpr = cleanExpr.replace(/\s+/g, '')
        .replace(/@0/g, baseCoordinate)
        .replace(/fw/g, fw)
        .replace(/fd/g, fd)
        .replace(/@idx/g, currentAxisDimension);

    return parseSimpleExpression(cleanExpr);
}


function parseSimpleExpression(pureMathExpr) {
    // 1. Precise Lexical Tokenizer (Handles numbers, operators, and parentheses)
    const rawTokens = pureMathExpr.match(/(\d*\.?\d+)|([\+\-\*\/\(\)])/g);
    if (!rawTokens) return parseFloat(pureMathExpr) || 0;

    // 2. Convert Infix to Postfix via Shunting-yard algorithm
    const postfixQueue = [];
    const operatorStack = [];

    const precedence = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2
    };

    for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];

        if (!isNaN(parseFloat(token))) {
            // Token is a number, push straight to output queue
            postfixQueue.push(parseFloat(token));
        } else if (token === '(') {
            operatorStack.push(token);
        } else if (token === ')') {
            // Pop operators off the stack to output queue until reaching matching '('
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                postfixQueue.push(operatorStack.pop());
            }
            operatorStack.pop(); // Discard the opening parenthesis
        } else {
            // Token is an operator (+, -, *, /)
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1] !== '(' &&
                precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
            ) {
                postfixQueue.push(operatorStack.pop());
            }
            operatorStack.push(token);
        }
    }

    // Flush remaining operators from stack to queue
    while (operatorStack.length > 0) {
        postfixQueue.push(operatorStack.pop());
    }

    // 3. Evaluate Postfix Expression Queue
    const evaluationStack = [];

    for (let i = 0; i < postfixQueue.length; i++) {
        const token = postfixQueue[i];

        if (typeof token === 'number') {
            evaluationStack.push(token);
        } else {
            const right = evaluationStack.pop() || 0;
            const left = evaluationStack.pop() || 0;

            switch (token) {
                case '+': evaluationStack.push(left + right); break;
                case '-': evaluationStack.push(left - right); break;
                case '*': evaluationStack.push(left * right); break;
                case '/': evaluationStack.push(left / (right || 1)); break; // Prevent divide by zero
            }
        }
    }

    return evaluationStack[0] || 0;
}

