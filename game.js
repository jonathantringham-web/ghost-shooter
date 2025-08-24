const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");

const tileSize = 20;
const rows = 31;
const cols = 28;

let level = 1;
let score = 0;
let lives = 3;

let player;
let ghosts = [];
let pellets = [];
let bats = [];
let map = [];

const SPEED = 2;

// Map template
const baseMap = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W............W............W",
  "W.WWWW.WWWWW.W.WWWW.WWWWW.W",
  "W.W  W.W   W.W.W   W.W  W.W",
  "W.WWWW.WWWWW.W.WWWW.WWWWW.W",
  "W..........................W",
  "W.WWWW.W.WWWWWWWWW.W.WWWW.W",
  "W.W    W.W     W  W.W    W.W",
  "W.WWWW W.W WWW W  W.WWWW W.W",
  "W..........................W",
  "WWWWW.WWWWW W W WWWWW.WWWWW",
  "     W.W   W W W   W.W     ",
  "WWWWW.W.WWW W W WWW.W.WWWWW",
  "W...........P.............W",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWW"
];

// Setup level
function initLevel() {
  pellets = [];
  bats = [];
  ghosts = [];
  player = null;
  map = [];

  for (let r = 0; r < baseMap.length; r++) {
    map[r] = [];
    for (let c = 0; c < baseMap[r].length; c++) {
      const ch = baseMap[r][c];
      map[r][c] = ch;
      const x = c * tileSize;
      const y = r * tileSize;

      if (ch === ".") {
        pellets.push({x, y, eaten: false});
      } else if (ch === "P") {
        player = {x, y, dir:{x:0,y:0}, nextDir:{x:0,y:0}, power:0};
      }
    }
  }
  // drop some bats
  bats.push({x: tileSize*1, y: tileSize*1, taken:false});
  bats.push({x: tileSize*26, y: tileSize*1, taken:false});
  bats.push({x: tileSize*1, y: tileSize*13, taken:false});
  bats.push({x: tileSize*26, y: tileSize*13, taken:false});

  // spawn ghosts
  for (let i=0;i<Math.min(3+level,6);i++) {
    ghosts.push({x: tileSize*14, y: tileSize*7, dir:{x:0,y:0}});
  }
}

function drawMap() {
  ctx.fillStyle="blue";
  for (let r=0;r<baseMap.length;r++) {
    for (let c=0;c<baseMap[r].length;c++) {
      if (map[r][c]==="W") {
        ctx.fillRect(c*tileSize, r*tileSize, tileSize, tileSize);
      }
    }
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMap();

  // pellets
  ctx.fillStyle="white";
  pellets.forEach(p=>{
    if(!p.eaten) ctx.fillRect(p.x+8,p.y+8,4,4);
  });

  // bats
  ctx.fillStyle="purple";
  bats.forEach(b=>{
    if(!b.taken){
      ctx.beginPath();
      ctx.arc(b.x+10,b.y+10,6,0,Math.PI*2);
      ctx.fill();
    }
  });

  // player
  ctx.fillStyle= player.power>0 ? "cyan" : "green";
  ctx.beginPath();
  ctx.arc(player.x+10,player.y+10,9,0,Math.PI*2);
  ctx.fill();

  // ghosts
  ctx.fillStyle="red";
  ghosts.forEach(g=>{
    ctx.beginPath();
    ctx.arc(g.x+10,g.y+10,9,0,Math.PI*2);
    ctx.fill();
  });
}

function update() {
  // player movement
  tryChangeDir(player);
  move(player);

  // pellet eat
  pellets.forEach(p=>{
    if(!p.eaten && Math.abs(player.x-p.x)<10 && Math.abs(player.y-p.y)<10){
      p.eaten=true;
      score+=10;
    }
  });

  // bats
  bats.forEach(b=>{
    if(!b.taken && Math.abs(player.x-b.x)<12 && Math.abs(player.y-b.y)<12){
      b.taken=true;
      player.power=400;
      score+=50;
    }
  });

  // ghosts
  ghosts.forEach(g=>{
    // random wander / chase
    if(Math.random()<0.05){
      const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      g.dir=dirs[Math.floor(Math.random()*4)];
    }
    move(g,1.2);

    // collision with player
    if(Math.abs(player.x-g.x)<10 && Math.abs(player.y-g.y)<10){
      if(player.power>0){
        // eat ghost
        g.x=tileSize*14; g.y=tileSize*7;
        score+=200;
      } else {
        lives--;
        if(lives<=0){
          alert("Game Over. Score: "+score);
          level=1; score=0; lives=3;
        }
        initLevel();
      }
    }
  });

  if(player.power>0) player.power--;

  // level complete
  if(pellets.every(p=>p.eaten)){
    level++;
    initLevel();
  }

  hud.textContent=`Score: ${score}   Lives: ${lives}   Level: ${level}`;
}

function move(entity,speedFactor=1){
  const speed=SPEED*speedFactor;
  let nx=entity.x+entity.dir.x*speed;
  let ny=entity.y+entity.dir.y*speed;
  if(!hitsWall(nx,ny)){
    entity.x=nx; entity.y=ny;
  }
}

function hitsWall(x,y){
  const r=Math.floor(y/tileSize);
  const c=Math.floor(x/tileSize);
  if(r<0||c<0||r>=rows||c>=cols) return true;
  return map[r][c]==="W";
}

function tryChangeDir(e){
  if(!hitsWall(e.x+e.nextDir.x*tileSize, e.y+e.nextDir.y*tileSize)){
    e.dir=e.nextDir;
  }
}

// controls
window.addEventListener("keydown",e=>{
  if(e.key==="ArrowUp") player.nextDir={x:0,y:-1};
  if(e.key==="ArrowDown") player.nextDir={x:0,y:1};
  if(e.key==="ArrowLeft") player.nextDir={x:-1,y:0};
  if(e.key==="ArrowRight") player.nextDir={x:1,y:0};
});

// swipe for mobile
let touchStartX=0,touchStartY=0;
canvas.addEventListener("touchstart",e=>{
  touchStartX=e.touches[0].clientX;
  touchStartY=e.touches[0].clientY;
});
canvas.addEventListener("touchend",e=>{
  let dx=e.changedTouches[0].clientX-touchStartX;
  let dy=e.changedTouches[0].clientY-touchStartY;
  if(Math.abs(dx)>Math.abs(dy)){
    player.nextDir=dx>0?{x:1,y:0}:{x:-1,y:0};
  }else{
    player.nextDir=dy>0?{x:0,y:1}:{x:0,y:-1};
  }
});

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

initLevel();
loop();
