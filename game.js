const NORMAL_CATEGORY = 0x0003;
const HELD_CATEGORY = 0x0002;
// 4 seconds
const DROP_TIME = 4000;

let engine = Matter.Engine.create();

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;

let heldShape = null;
let dropInput = true;
let isHolding = false;

let isPaused = false;

let mouseOffsetX = 0;
let initialMouseX = 0;

// touch controls
let touchStartX = 0;
let hasMoved = false;
const MOVE_THRESHOLD = 5;

// top bar
let topBar = document.createElement('div');
topBar.style.position = 'absolute';
topBar.style.top = '-1px';
topBar.style.left = '0px';
topBar.style.width = windowWidth + 'px';
topBar.style.height = '75px';
topBar.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';



document.body.appendChild(topBar);

let score = 0;
let scoreText = createText({
    text: '0',
    x: 'center',
    y: 10,
    justify: 'center',
    fontSize: '50px',
    //drop shadow
    textShadow: '0 0 10px rgba(0, 0, 0, 1.0)',
    id: 'scoreText',
    fontWeight: 'bold'
});

// Create pause button
const pauseButton = document.createElement('button');
pauseButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm224-72l0 144c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-144c0-13.3 10.7-24 24-24s24 10.7 24 24zm112 0l0 144c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-144c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>`;
// Style the button
pauseButton.style.position = 'absolute';
pauseButton.style.left = '20px';
pauseButton.style.top = '20px';
pauseButton.style.width = '40px';
pauseButton.style.height = '40px';
pauseButton.style.backgroundColor = 'transparent';
pauseButton.style.border = 'none';
pauseButton.style.cursor = 'pointer';
//pauseButton.style.zIndex = '1001'; // Above pause overlay
pauseButton.style.padding = '0';
pauseButton.style.fill = 'white'; // SVG color

// Add hover effect
pauseButton.addEventListener('mouseover', () => {
    pauseButton.style.opacity = '0.8';
  });
  pauseButton.addEventListener('mouseout', () => {
    pauseButton.style.opacity = '1';
  });
  
  // Add click event to toggle pause
  pauseButton.addEventListener('click', () => {
    togglePause();
    if (isPaused && lives > 0) {
      subText.innerHTML = 'tap to resume';
    }
  });

  // Add touch event to toggle pause
  pauseButton.addEventListener('touchstart', (event) => {
    event.preventDefault();
    pauseButton.style.opacity = '0.8';
  });

  pauseButton.addEventListener('touchend', (event) => {
    event.preventDefault();
    pauseButton.style.opacity = '1';
    togglePause();
    if (isPaused && lives > 0) {
      subText.innerHTML = 'tap to resume';
    }
  });
  
// Add to document
document.body.appendChild(pauseButton);

// create best score text
const bestText = createText({
    text: 'best:<br>' + getBestScore(),
    x: '70px',
    y: '20px',
    fontSize: '16px',
    id: 'bestText',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(0, 0, 0, 1.0)',
});

let lives = 10;
let livesText = createText({
    text: '10 ♥︎',
    x: 'right',
    y: 25,
    justify: 'right',
    fontSize: '25px',
    id: 'livesText',
    fontWeight: 'bold',
    textShadow: '0 0 10px rgba(0, 0, 0, 1.0)',
});

let timer = 4;

let timerText = createText({
    text: '',
    x: 20,
    y: 80,
    id: 'timerText',
    fontWeight: 'bold'
}); 

const titleText = createText({
    text: '',
    x: 'center',
    y: (windowHeight/2) - 150,
    justify: 'center',
    fontSize: '60px',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold'
});

const subText = createText({
    text: '',
    x: 'center',
    y: (windowHeight/2) - 50,
    justify: 'center',
    fontSize: '30px',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold'
});

let pauseOverlay = document.createElement('div');
pauseOverlay.style.position = 'absolute';
pauseOverlay.style.top = '0';
pauseOverlay.style.left = '0';
pauseOverlay.style.width = '100%';
pauseOverlay.style.height = '100%';
pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
pauseOverlay.style.display = 'none'; // Initially hidden
pauseOverlay.style.zIndex = '1000'; // Ensure it's on top of everything
document.body.appendChild(pauseOverlay);


// make gravity slower
engine.gravity.y = 0.5;

let render = Matter.Render.create({
    element:document.body,
    engine:engine,
    options: {
        // adapt to the size of the window
        width: windowWidth,
        height: windowHeight,
        //turn off the wireframe
        wireframes: false
    }
});

let ground = Matter.Bodies.rectangle(400, 35, 810, 70, { isStatic: true });

//Matter.World.add(engine.world, [ground]);
// mouse controls

let mouse = Matter.Mouse.create(render.canvas);
let mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    },
    collisionFilter: {
        mask: 0x0000
    }
});

render.mouse = mouse;


//create balance beam and its constraint
// rectangle params as follows (x, y, width, height)
let beam = Matter.Bodies.rectangle(windowWidth/2, windowHeight/1.7 , 400, 10, {
    friction: 1,
    frictionStatic: 5
});

let constraint = Matter.Constraint.create({
    bodyA: beam,
    pointB: Matter.Vector.clone(beam.position),
    stiffness: 1,
    length: 0,
});

Matter.World.add(engine.world, [mouseConstraint, beam, constraint]);

let guideLine = Matter.Bodies.rectangle(windowWidth / 2, 60, 4, 120, {
    isStatic: true,
    render: {
        fillStyle: 'white'
    },
    collisionFilter: {
        category: 0x0004,
        mask: 0x0000
    }
});

Matter.World.add(engine.world, [guideLine]);

// add timer bar
let timerBar = document.createElement('div');
timerBar.style.position = 'absolute';
timerBar.style.top = '0px';
timerBar.style.left = '0px';
timerBar.style.width =  windowWidth + 'px';
timerBar.style.height = '0.1px';
timerBar.style.backgroundColor = 'rgba(255, 255, 255)';
//timerBar.style.borderRadius = '10px';
timerBar.style.overflow = 'hidden';
timerBar.style.zIndex = '1000';
document.body.appendChild(timerBar);

let runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);
Matter.Render.run(render);

// create the first shape
heldShape = createRandomShape(windowWidth/2, 100);

// Create a function to apply restoring torque to the beam
Matter.Events.on(engine, 'beforeUpdate', function() {
    // Only apply torque if the beam isn't perfectly horizontal
    if (beam.angle !== 0) {
        // Calculate restoring torque - strength controls how quickly it returns
        let strength = 0.0008; // Adjust this value to change the strength of the torque
        let damping = 0.08; // Adjust this value to change the damping effect
        let restoringTorque = -strength * beam.angle;
        // Apply damping to the angular velocity
        let dampingTorque = -damping * beam.angularVelocity;
        
        // Apply the torque to the beam
        Matter.Body.setAngularVelocity(beam, beam.angularVelocity + restoringTorque + dampingTorque);
    }
});

// score text
document.body.appendChild(scoreText);

// II. FUNCTIONS

// create text
function createText(options) {
   const defaults = {
        text: "",
        x: "20px",
        y: "20px",
        color: "white",
        justify: "left",
        fontSize: "20px",
        fontFamily: "Arial, sans-serif",
        id: ""
    };

    const config = { ...defaults, ...options };

    const textElement = document.createElement('div');
    textElement.innerHTML = config.text;
    textElement.style.position = 'absolute';

    // make non-selectable
    textElement.style.userSelect = 'none';

    // positioning
    if (config.x === 'center' && config.y === 'middle') {
        textElement.style.left = '50%';
        textElement.style.top = '50%';
        textElement.style.transform = 'translate(-50%, -50%)';
    } else if (config.x === 'center') {
        textElement.style.left = '50%';
        textElement.style.transform = 'translateX(-50%)';
    } else if (config.x === 'right') {
        textElement.style.right = '20px';
    } else {
        textElement.style.left = typeof config.x === 'number' ? config.x + 'px' : config.x;
    }
    
    if (config.y === 'middle' && config.x !== 'center') {
        textElement.style.top = '50%';
        textElement.style.transform = 'translateY(-50%)';
    } else if (config.y === 'bottom') {
        textElement.style.bottom = '20px';
    } else if (config.y !== 'middle') {
        textElement.style.top = typeof config.y === 'number' ? config.y + 'px' : config.y;
    }

    // style
    textElement.style.color = config.color;
    textElement.style.fontSize = config.fontSize;
    textElement.style.fontFamily = config.fontFamily;
    textElement.style.textAlign = config.justify;
    textElement.style.fontWeight = config.fontWeight || 'normal'; // default to normal if not provided

    // text shadow
    if (config.textShadow) {
        textElement.style.textShadow = config.textShadow;
    }

    // id (optional)
    if (config.id) {
        textElement.id = config.id;
    }

    document.body.appendChild(textElement);
    return textElement;
}

// toggle pause
function togglePause() {
    if( lives > 0) {
    if (isPaused) {
        Matter.Runner.run(runner, engine);
        isPaused = false;
        // Remove pause text
        if (titleText) {
            titleText.innerHTML = '';
            subText.innerHTML = ''
        }
        // Hide pause overlay
        pauseOverlay.style.display = 'none';
        
    } else {
        Matter.Runner.stop(runner);
        isPaused = true;
        // Show pause text
        titleText.innerHTML = 'pause';
        // Show pause overlay
        pauseOverlay.style.display = 'block';
        titleText.style.zIndex = '1001';
        subText.style.zIndex = '1001';

        }
    }
}
// Create explosion effect function
function explode(x, y, color = 'white', size = 10, shape) {
    // Remove the shape from the matter world
    Matter.World.remove(engine.world, shape);
    // Number of particles to create
    const particleCount = Math.floor(Math.random() * 8) + 10; // 10-17 particles
    
    // Create multiple particles
    for (let i = 0; i < particleCount; i++) {
        // Create explosion particle element
        const explosionParticle = document.createElement('div');
        explosionParticle.className = 'explosion';
        
        // Random offset from center position
        const offsetX = (Math.random() - 0.5) * size * 2;
        const offsetY = (Math.random() - 0.5) * size * 2;
        
        // Random size for each particle (50-100% of original size)
        const particleSize = Math.random() * size * 0.5 + size * 0.5;
        
        // Apply styles
        explosionParticle.style.position = 'absolute';
        explosionParticle.style.left = `${x + offsetX}px`;
        explosionParticle.style.top = `${y + offsetY}px`;
        explosionParticle.style.width = `${particleSize}px`;
        explosionParticle.style.height = `${particleSize}px`;
        explosionParticle.style.borderRadius = '50%';
        
        // Random color variation
        const colorVariation = Math.random() * 50;
        if (color === 'white') {
            explosionParticle.style.backgroundColor = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
        } else {
            explosionParticle.style.backgroundColor = color;
        }
        
        explosionParticle.style.opacity = '1';
        explosionParticle.style.transform = 'scale(1.5)'; // Start larger
        explosionParticle.style.transition = `all ${Math.random() * 0.2 + 0.2}s ease-out`; // Random duration
        explosionParticle.style.zIndex = '1000';
        document.body.appendChild(explosionParticle);
        
        // Generate random movement direction
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * size * 3;
        const moveX = Math.cos(angle) * distance;
        const moveY = Math.sin(angle) * distance;
        
        // Animate and remove the particle
        setTimeout(() => {
            explosionParticle.style.transform = 'scale(0.1)'; // Shrink to small
            explosionParticle.style.opacity = '0';
            explosionParticle.style.left = `${parseInt(explosionParticle.style.left) + moveX}px`;
            explosionParticle.style.top = `${parseInt(explosionParticle.style.top) + moveY}px`;
            
            setTimeout(() => {
                document.body.removeChild(explosionParticle);
            }, 300);
        }, 10);
    }
}

// reset the game
function restartGame() {
    // Reset the game
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);
    Matter.Render.stop(render);
    Matter.Runner.stop(runner);
    // reload the page
    console.log('restarting game');
    location.reload();
}

// game over
function gameOver() {
    
    // Show game over text
    titleText.innerHTML = 'game over';
    // disable text wrapping
    titleText.style.whiteSpace = 'nowrap';
    subText.innerHTML = 'press r or enter to restart';
    let scoreSubText = createText({
        text: 'your score: ' + score,
        // disable text wrapping
        whiteSpace: 'nowrap',
        x: 'center',
        y: (windowHeight/2) + 100,
        justify: 'center',
        fontSize: '30px',
        fontWeight: 'bold',
    });
    // Save the best score
    saveBestScore(score);
    // Get the best score
    const bestScore = getBestScore();
    const bestScoreText = createText({
        text: 'best score: ' + bestScore,
        // disable text wrapping
        whiteSpace: 'nowrap',
        x: 'center',
        y: (windowHeight/2) + 150,
        justify: 'center',
        fontSize: '30px',
        fontWeight: 'bold',
    });

    // Show pause overlay
    pauseOverlay.style.display = 'block';
    titleText.style.zIndex = '1001';
    subText.style.zIndex = '1001';
    scoreSubText.style.zIndex = '1001';
    bestScoreText.style.zIndex = '1001';
    // Get all bodies (except the ground and beam)
    const allBodies = Matter.Composite.allBodies(engine.world).filter(body => body !== ground && body !== beam);
    
    // Explode all the bodies
    allBodies.forEach(body => {
            explode(body.position.x, body.position.y, body.render.fillStyle, 10, body);
    });
}

function updateTimer() {
    if (!isPaused && lives > 0) {
        timer -= 0.1; // Decrease by 0.1 seconds
        timer = Math.max(0, timer); // Don't go below zero
        // timerText.innerHTML = 'timer: ' + timer.toFixed(1); // Display with one decimal place
        
        // If timer reaches zero, automatically drop the current shape
        if (timer <= 0) {
            if (heldShape) {
                Matter.Body.setStatic(heldShape, false);
                heldShape.collisionFilter.category = NORMAL_CATEGORY;
                heldShape.collisionFilter.mask = 0xFFFF;
                heldShape = null;
            }
            
            // grab a new shape and reset the timer
            getNewPiece();
            timer = 4; // Reset timer to 3 seconds
        }
    }
}

function updateTimerBar() {
    if (!isPaused && lives > 0) {
        timerBar.style.transition = 'width 0.1s linear, left 0.1s linear, background-color 0.1s linear, box-shadow 0.1s linear';

        // Shrink from the center
        const barWidth = (timer / 4) * windowWidth; // Calculate width based on timer
        timerBar.style.width = barWidth + 'px';
        timerBar.style.left = (windowWidth - barWidth) / 2 + 'px'; // Center the bar
    } else {
        // Reset the (centered) timer bar when paused
        timerBar.style.width = '0px';
        timerBar.style.left = (windowWidth - 0) / 2 + 'px'; // Center the bar
    }
}

// Add this line to set up the timer interval (100ms = 0.1s updates)
setInterval(updateTimer, 100);
// Add this line to set up the timer bar update interval (100ms = 0.1s updates)
setInterval(updateTimerBar, 100);

// update score
function updateScore(newScore) {
    score = newScore;
    scoreText.innerHTML = score;
}

// get the best score from local storage
function getBestScore() {
    const bestScore = localStorage.getItem('bestScore');
    if (bestScore) {
        return parseInt(bestScore);
    }
    return 0;
}

// save the best score to local storage
function saveBestScore(newScore) {
    const bestScore = getBestScore();
    if (newScore > bestScore) {
        localStorage.setItem('bestScore', newScore);
    }
}

// update lives
function updateLives(newLives) {
    //no transition
    livesText.style.transition = 'none';
    //pink
    livesText.style.color = 'red';

    lives = newLives;
    livesText.innerHTML = lives + ' ♥︎';

    // add transition back
    setTimeout(() => {
        livesText.style.transition = 'color 0.25s ease-in-out';
        livesText.style.color = 'white';
    }, 50);
}

// get new piece animation: the guide beam goes up and comes down with a new random shape
function getNewPiece() {
    //disable the space input until the animation is complete
    dropInput = false;
    // Store current guide line position
    const startY = guideLine.position.y;
    // Set speed for animation
    const animationSpeed = 9;
    let animationPhase = 1; // 1 = going up, 2 = creating shape, 3 = coming down
    
    // Remove the old held shape reference
    heldShape = null;
    
    // Create animation interval
    const animationInterval = setInterval(() => {
        if (isPaused) return; // Don't animate while paused
        
        if (animationPhase === 1) {
            // Phase 1: Guide line moves up off screen
            const newY = guideLine.position.y - animationSpeed;
            Matter.Body.setPosition(guideLine, {
                x: guideLine.position.x,
                y: newY
            });
            
            // When guide line is offscreen, switch to phase 2
            if (newY < -50) {
                animationPhase = 2;
                // Create new shape offscreen
                heldShape = createRandomShape(windowWidth/2, -50);
                // Reset timer
                timer = 4;
            }
        } 
        else if (animationPhase === 2) {
            // Phase 2: Brief pause before starting descent
            animationPhase = 3;
        }
        else if (animationPhase === 3) {
            // Phase 3: Both guide line and shape descend together
            const newY = guideLine.position.y + animationSpeed;
            Matter.Body.setPosition(guideLine, {
                x: guideLine.position.x,
                y: newY
            });
            
            if (heldShape) {

                Matter.Body.setPosition(heldShape, {
                    x: heldShape.position.x,
                    y: newY + 50 // Move shape down with guide line
                });
                
            }
            
            // When guide line reaches original position, end animation
            if (newY >= startY) {
                Matter.Body.setPosition(guideLine, {
                    x: guideLine.position.x, 
                    y: startY
                });
                
                if (heldShape) {
                    Matter.Body.setPosition(heldShape, {
                        x: heldShape.position.x,
                        y: 100 // Final position for the held shape
                    });
                }
                
                // End the animation
                clearInterval(animationInterval);
                dropInput = true;
            }
        }
    }, 16); // ~60fps
}

// create a random shape at the cursor position
function createRandomShape(x, y) {
    //reset the guide line position
    Matter.Body.setPosition(guideLine, {
        x: windowWidth / 2,
        y: guideLine.position.y
    });
    const shapeType = Math.floor(Math.random() * 5); // 0 to 4
    let shape;
    
    switch(shapeType) {
        case 0: // Square
            shape = Matter.Bodies.rectangle(x, y, 30, 30);
            break;
        case 1: // Triangle
            shape = Matter.Bodies.polygon(x, y, 3, 20);
            break; 
        case 2: // Hexagon
            const hexRadius = 30 / 1.732; // 30 is the width of the hexagon
            shape = Matter.Bodies.polygon(x, y, 6, hexRadius);
            break;
        case 3: // Rhombus
            const rhombusWidth = 30; // Increased from 30
            const rhombusHeight = 20; // Direct value instead of calculation
            shape = Matter.Bodies.fromVertices(x, y, [
                { x: 0, y: -rhombusHeight },
                { x: rhombusWidth/2, y: 0 },
                { x: 0, y: rhombusHeight },
                { x: -rhombusWidth/2, y: 0 }
            ]);
            break;
        case 4: // Circle
            shape = Matter.Bodies.circle(x, y, 15);
            break;
    }

    shape.friction = 1;
    shape.frictionStatic = 5;
    shape.isStatic = true;
    
    shape.collisionFilter.category = HELD_CATEGORY;
    shape.collisionFilter.mask = 0x0000; // No collision with anything else

    shape.hasBeenRemoved = false;
    
    /* Random color
    shape.render = {
        fillStyle: '#' + Math.floor(Math.random()*16777215).toString(16)
    };
    */
   
   shape.colorGroup = new Set();

   // set timer bar to shape color
   timerBar.style.backgroundColor = shape.render.fillStyle;
   timerBar.style.boxShadow = `0 0 20px 4px ${shape.render.fillStyle}, 0 0 40px 8px ${shape.render.fillStyle}`;

    Matter.World.add(engine.world, shape);
    return shape;
}

// III. EVENT LISTENERS

// draw the guide line before the shapes
/*
Matter.Events.on(render, 'afterRender', function() {
    if (heldShape) {
        const ctx = render.context;
        ctx.save();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(heldShape.position.x, 0); 
        ctx.lineTo(heldShape.position.x, 120);
        ctx.stroke();
        ctx.restore();

    }
});
*/

// event listener for spacebar
document.addEventListener('mousedown', function(event) {
    isHolding = true;
    hasMoved = false;

    // set the initial mouse position
    mouseStartX = event.clientX;
    initialMouseX = event.clientX;
    mouseOffsetX = heldShape.position.x - event.clientX;
});

document.addEventListener('touchstart', function(event) {
    event.preventDefault();
    isHolding = true;
    hasMoved = false;

    const touch = event.touches[0];
    touchStartX = touch.clientX;
    initialMouseX = touch.clientX;
    mouseOffsetX = heldShape.position.x - touch.clientX;
});

document.addEventListener('mousemove', function(event) {
    if (isHolding && heldShape && !isPaused) {
        const newX = event.clientX + mouseOffsetX;

        // check if the mouse has moved enough to register as a drag
        if (Math.abs(event.clientX - mouseStartX) > MOVE_THRESHOLD) {
            hasMoved = true;
        }
        // Move existing shape to follow mouse x position
        Matter.Body.setPosition(heldShape, {
            x: newX,
            y: heldShape.position.y
        }); 
        // Move the guide line to follow the held shape
        Matter.Body.setPosition(guideLine, {
            x: heldShape.position.x,
            y: guideLine.position.y
        });
    }
});

document.addEventListener('touchmove', function(event) {
    event.preventDefault();
    if (isHolding && heldShape && !isPaused) {
        const touch = event.touches[0];
        const newX = touch.clientX + mouseOffsetX;

        // Check if the touch has moved enough to register as a drag
        if (Math.abs(touch.clientX - touchStartX) > MOVE_THRESHOLD) {
            hasMoved = true;
        }

        // Move existing shape to follow touch x position
        Matter.Body.setPosition(heldShape, {
            x: newX,
            y: heldShape.position.y
        });

        // Move the guide line to follow the held shape
        Matter.Body.setPosition(guideLine, {
            x: heldShape.position.x,
            y: guideLine.position.y
        });
    }
});

document.addEventListener('mouseup', function(event) {
    isHolding = false;

    // If we haven't moved significantly, drop the piece!
    if (!hasMoved && dropInput && heldShape && !isPaused) {
        Matter.Body.setStatic(heldShape, false);
        heldShape.collisionFilter.category = NORMAL_CATEGORY;
        heldShape.collisionFilter.mask = 0xFFFF;
        heldShape = null;

        // Create a new shape
        getNewPiece();
        timer = 4; // Reset timer
    }

    // if paused, unpause the game
    if (isPaused) {
        togglePause();
    }
});

document.addEventListener('touchend', function(event) {
    event.preventDefault();
    isHolding = false;
    
    // If we haven't moved significantly, drop the piece!
    if (!hasMoved && dropInput && heldShape && !isPaused) {
        Matter.Body.setStatic(heldShape, false);
        heldShape.collisionFilter.category = NORMAL_CATEGORY;
        heldShape.collisionFilter.mask = 0xFFFF;
        heldShape = null;
        
        // Create a new shape
        getNewPiece();
        timer = 4; // Reset timer
    }

    // if paused, unpause the game
    if (isPaused) {
        togglePause();
    }
});

document.addEventListener('keydown', function(event) {
    // drop the held shape
    if (event.code === 'Space' && dropInput) {
        if (isPaused && lives > 0) {
            //unpause the game
            togglePause();
        }
        if (lives > 0 && !isPaused) {
        if (heldShape) {
        Matter.Body.setStatic(heldShape, false);
        heldShape.collisionFilter.category = NORMAL_CATEGORY;
        heldShape.collisionFilter.mask = 0xFFFF;
        heldShape = null;
        }
        if (!heldShape) {
            // Create a new shape at the mouse position
            //heldShape = createRandomShape(windowWidth/2, 100);
            getNewPiece();
            // reset the timer
            timer = 4; // Reset timer to 3 seconds
        }
    }
        // Prevent page scrolling when pressing space
        event.preventDefault();
    }
    // restart the game
    if (event.code === 'KeyR') {
        // Reset the game
        restartGame();
    }

    // toggle pause
    if (event.code === 'KeyP') {
        togglePause();
        if (isPaused && lives > 0) {
        subText.innerHTML = 'tap to resume';
        }
    }

    if (event.code === 'Enter') {
        if (lives <= 0) {
            restartGame();
        } else {
            // Pause the game
            togglePause();
            if (isPaused && lives > 0) {
                subText.innerHTML = 'tap to resume';
                }
        }
    }

});   
const connectedShapes = {};

// Add collision detection
Matter.Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;
    
    // Check each collision pair
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;
        
        // Skip if either body is the ground, beam or currently held
        if (bodyA === ground || bodyA === beam || bodyA === heldShape ||
            bodyB === ground || bodyB === beam || bodyB === heldShape) {
            continue;
        }
        
        // Get the colors Matter.js assigned
        const colorA = bodyA.render && bodyA.render.fillStyle;
        const colorB = bodyB.render && bodyB.render.fillStyle;
        
        // Check if both bodies have the same color
        if (colorA && colorB && colorA === colorB) {
            // Initialize color groups if they don't exist
            if (!bodyA.colorGroup) bodyA.colorGroup = new Set();
            if (!bodyB.colorGroup) bodyB.colorGroup = new Set();
            
            // Connect these objects in each other's colorGroup
            bodyA.colorGroup.add(bodyA);
            bodyA.colorGroup.add(bodyB);
            bodyB.colorGroup.add(bodyA);
            bodyB.colorGroup.add(bodyB);
            
            // Merge color groups
            bodyA.colorGroup.forEach(body => {
                bodyB.colorGroup.forEach(otherBody => {
                    body.colorGroup.add(otherBody);
                    otherBody.colorGroup.add(body);
                });
            });
            
            // Check if we have 3 or more of the same color
            if (bodyA.colorGroup.size >= 3) {
                // Create an array from the set for removal
                const bodiesToRemove = Array.from(bodyA.colorGroup);
                        bodiesToRemove.forEach(body => {
                            if (!body.hasBeenRemoved) {
                                body.hasBeenRemoved = true;
                                // Create explosion effect at the position of the body
                                const position = body.position;
                                explode(position.x, position.y, body.render.fillStyle, 10, body);
                                //Matter.World.remove(engine.world, body);
                                // Update score
                                updateScore(score + 10);
                            }
                    });
            }
        }
    }
});

Matter.Events.on(engine, 'collisionEnd', function(event) {
    const pairs = event.pairs;
    
    // Check each collision pair
    for (let i = 0; i < pairs.length; i++) {
        const bodyA = pairs[i].bodyA;
        const bodyB = pairs[i].bodyB;
        
        // Skip if either body is the ground, beam or currently held
        if (bodyA === ground || bodyA === beam || bodyA === heldShape ||
            bodyB === ground || bodyB === beam || bodyB === heldShape) {
            continue;
        }
        
        // Remove the color group if the bodies are no longer in contact
        if (bodyA.colorGroup && bodyB.colorGroup) {
            bodyA.colorGroup.delete(bodyB);
            bodyB.colorGroup.delete(bodyA);
            
            // If the color group is empty, remove it
            if (bodyA.colorGroup.size === 0) {
                delete bodyA.colorGroup;
            }
            if (bodyB.colorGroup.size === 0) {
                delete bodyB.colorGroup;
            }
        }
    }
});

Matter.Events.on(engine, 'beforeUpdate', function() {
    const allBodies = Matter.Composite.allBodies(engine.world);

    allBodies.forEach(body => {
        // Check if the body is below the canvas height
        if (body.position.y > windowHeight) {
            // Remove the body from the world
            explode(body.position.x, (body.position.y - 20), body.render.fillStyle, 20, body);


            // Deduct a life
            updateLives(lives - 1);

            // Check if lives are zero
            if (lives <= 0) {
                gameOver();
            }
        }
    });
});

// if user clicks outside the window or switches tabs, pause the game
window.addEventListener('blur', function() {
    if (!isPaused) {
        togglePause();
        if (lives > 0) {
            subText.innerHTML = 'press p or enter to resume';
            }
    }
});

/*
// if user clicks inside the window, resume the game
window.addEventListener('focus', function() {
    if (isPaused) {
        togglePause();
    }
});
*/

window.addEventListener('resize', function() {
    // Store old dimensions for calculating ratios
    const oldWidth = windowWidth;
    const oldHeight = windowHeight;
    
    // Update to new dimensions
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    // Calculate scale ratios
    const widthRatio = windowWidth / oldWidth;
    const heightRatio = windowHeight / oldHeight;

    // Update the render options
    render.options.width = windowWidth;
    render.options.height = windowHeight;
    
    // Update the canvas element itself
    render.canvas.width = windowWidth;
    render.canvas.height = windowHeight;
    
    // Update the bounds of the mouse
    mouse.element.removeEventListener('mousemove', mouse.mousemove);
    mouse.element.removeEventListener('mousedown', mouse.mousedown);
    mouse.element.removeEventListener('mouseup', mouse.mouseup);
    mouse = Matter.Mouse.create(render.canvas);
    mouseConstraint.mouse = mouse;
    render.mouse = mouse;

    // Update the ground position
    Matter.Body.setPosition(ground, { x: windowWidth / 2, y: windowHeight - 30 });

    // Update the beam position
    Matter.Body.setPosition(beam, { x: windowWidth / 2, y: windowHeight / 1.7 });

    // Update the constraint point
    constraint.pointB = Matter.Vector.clone(beam.position);

    // Update the guide line position
    Matter.Body.setPosition(guideLine, { x: windowWidth / 2, y: guideLine.position.y });
    
    // Update the top bar size
    topBar.style.width = windowWidth + 'px';

    // Update timer bar sizing
    timerBar.style.width = (timer / 4) * windowWidth + 'px';
    timerBar.style.left = (windowWidth - ((timer / 4) * windowWidth)) / 2 + 'px';
    
    // Update all other bodies' positions
    const allBodies = Matter.Composite.allBodies(engine.world);
    allBodies.forEach(body => {
        // Skip special bodies that are already handled
        if (body === ground || body === beam || body === guideLine) {
            return;
        }
        
        // Scale the position of the body
        Matter.Body.setPosition(body, {
            x: body.position.x * widthRatio,
            y: body.position.y * heightRatio
        });
    });
    
    // Update text positions that depend on window dimensions
    titleText.style.top = (windowHeight/2 - 150) + 'px';
    subText.style.top = (windowHeight/2 - 50) + 'px';
    
    // Force a render update
    Matter.Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: windowWidth, y: windowHeight }
    });
});