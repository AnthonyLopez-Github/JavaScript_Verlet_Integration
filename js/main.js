/*
Xn+1 = 2Xn - Xn-1 + an(dt^2)

ToDo:
Subdivide horizontally for better performance when the particles are veritcle.
*/

let metersToPixels;
let pArr = [];

let subDivCount = 20;
let pList = [];

let passCount = 8;
let ww, wh;

let accSlider;
let resetSliders;

let states = {
  isGrabbed: 0
}

function windowResized() {
  resizeCanvas(windowWidth * 0.75, windowHeight * 0.75);
  ww = (windowWidth * 0.75) / 3780;
  wh = (windowHeight * 0.75) / 3780;
}

function setup() {
  accSlider = createVector(0, 0);
  resetSliders = createButton("Reset Acceleration");
  
  
  accSlider.x = createSlider(-9.81, 9.81, 0, 0.01);
  accSlider.x.position(10, 40);
  accSlider.x.style('width', '20%');
  
  accSlider.y = createSlider(-9.81, 9.81, -9.81, 0.01);
  accSlider.y.position(10, 10);
  accSlider.y.style('width', '20%');
  
  resetSliders.position(10, 70);
  resetSliders.mousePressed(resetAcc);
  
  metersToPixels = [
    3780, 0,
    0, 3780, 
    0, 0
  ];
  
  for(let i = 0 ; i < subDivCount ; i++) {
    pList[i] = [];
  }
  
  ww = (windowWidth * 0.75) / 3780;
  wh = (windowHeight * 0.75) / 3780;
  
  
  let radius, rx, ry;
  for(let i = 0 ; i < 100 ; i++) {
    radius = random(0.0025, 0.005);
    rx = random(0 + radius, ww - radius);
    ry = random(0 + radius, wh - radius);
    
    pArr[i] = createParticle(createVector(rx, ry), createVector(rx, ry), createVector(accSlider.x.value(), accSlider.y.value()), radius);
  }
  
  frameRate(60);
  createCanvas(windowWidth * 0.75, windowHeight * 0.75);
}

function draw() {
  background(255);

  push();
  applyMatrix(metersToPixels);
  
  for(let i = 0 ; i < passCount ; i++) {
    particleGrabbable(pArr);
    sliderUpdateAcc(pArr);
    findObjectPositions(pArr);
    collisionBounds(pArr);
    applyVerlet(pArr);
  }
  
  displayParticle(pArr);
  pop();
  noStroke();
  fill(0, 0, 255);
  text("Y Acceleration: " + accSlider.y.value(), windowWidth * 0.23, 25);
  text("X Acceleration: " + accSlider.x.value(), windowWidth * 0.23, 55);
}

function particleGrabbable(objArr) {
  let mousePos = createVector(mouseX / 3780, mouseY / 3780);
  let d;
  
  objArr.forEach(e => {
    d = p5.Vector.dist(mousePos, e.pos);
    if(d < e.rad && mouseIsPressed) {
      states.isGrabbed = 1;
    } else {
      states.isGrabbed = 0;
    }
  });
}

function resetAcc() {
  accSlider.x.value(0);
  accSlider.y.value(-9.81);
}

function sliderUpdateAcc(objArr) {
  objArr.forEach(e => {
    e.acc.x = -accSlider.x.value();
    e.acc.y = accSlider.y.value();
  });
}

function findObjectPositions(objArr) {
  let subDivWidth = (ww / subDivCount);
  
  for(let i = 0 ; i < pList.length ; i++) {
    pList[i] = [];
  }
  
  objArr.forEach(e => {
    let i = floor(e.pos.x / subDivWidth);
    if(i >= 0 && i <= (subDivCount - 1)) {
      pList[i].push(e);
    }
  });
}

function collisionBounds(objArr) {
  let d;
  let correction;
  let u;
  
  // Bounds for screen
  objArr.forEach(e => {
    if(e.pos.y > (wh) - e.rad) {
      e.pos.y = (wh) - e.rad;
    }
  });
  objArr.forEach(e => {
    if(e.pos.x > (ww) - e.rad) {
      e.pos.x = (ww) - e.rad;
    }
  });
  objArr.forEach(e => {
    if(e.pos.x < 0 + e.rad) {
      e.pos.x = 0 + e.rad;
    }
  });
  objArr.forEach(e => {
    if(e.pos.y < 0 + e.rad) {
      e.pos.y = 0 + e.rad;
    }
  });
  
  // Ball collision (Gross nested loops too)
  for(let i = 0 ; i < pList.length ; i++) {
    let arr;
    if(i == 0) {
      arr = pList[i].concat(pList[i+1]);
    } else if(i == (subDivCount - 1)) {
      arr = pList[i].concat(pList[i-1]);
    } else {
      arr = pList[i].concat(pList[i+1].concat(pList[i-1]));
    }
    
    for(let i = 0 ; i < arr.length ; i++) {
      for(let j = 0 ; j < i ; j++) {
        d = p5.Vector.dist(arr[i].pos, arr[j].pos);
        u = p5.Vector.sub(arr[i].pos, arr[j].pos);
        u.normalize();
      
        if(d < (arr[i].rad + arr[j].rad)) {
          correction = ((arr[i].rad + arr[j].rad) - d) * 0.5;
          arr[i].pos = p5.Vector.add(arr[i].pos, p5.Vector.mult(u, correction));
          arr[j].pos = p5.Vector.add(arr[j].pos, p5.Vector.mult(u, -correction));
        }
      }
    }
  }
  
}

function displayParticle(objArr) {
    noStroke();
    fill(255, 0, 0);
  objArr.forEach(e => {

    ellipse(e.pos.x, e.pos.y, (e.rad * 2));
  });
}

function applyVerlet(objArr) {
  let dt = ((1/60) * (1/passCount));
  let newPos;
  
  objArr.forEach(e => {
    newPos = p5.Vector.sub(p5.Vector.mult(e.pos, 2), p5.Vector.add(e.oldPos, p5.Vector.mult(e.acc, (dt * dt))));
    e.oldPos = e.pos.copy();
    e.pos = newPos.copy();
  });
}

function createParticle(posVec, oldPosVec, accVec, r) {
  return {
    pos: posVec,
    oldPos: oldPosVec,
    acc: accVec,
    rad: r
  }
}
