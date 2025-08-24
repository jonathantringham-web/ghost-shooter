const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 20;
const rows = 31;
const cols = 28;

let level = 1;
let score = 0;
let lives = 3;
let pellets = [];
let bats = [];
let ghosts = [];
let player;

// --- Map Layout (W=wall, .=pellet, B=bat, P=player spawn) ---
const baseMap = [
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWW",
  "W............W...........BW",
  "W.WWWW.WWWWW.W.WWWW.WWWW.WW",
  "W.W  W.W   W.W.W  W.W  W..W",
  "W.WWWW.WWWWW.W.WWWW.WWWWW.W",
  "W.........................W",
  "W.WWWW.W.WWWWWWW.W.WWWW.W.W",
  "W.W    W.W     W.W.W   W.WW",
  "W.WWWW W.W WWW W.W.WWWW.W.W",
  "W..... . .  .  . . ..... .W",
  "WWWWW.WWWWW W WWWWW.WWWWW.W",
  "W   W.W   W W W   W.W   W.W",
  "W.W W.WWW W W W WW.W W W.WW",
  "W.W........P...........W..W",
  "WWWWWWWWWWWWWWWWWWWWWWWWWWWW"
];

let grid = [];

function initLevel() {
  grid = [];
  pellets = [];
  bats = [];
  ghosts = [];
  player = null;

  for (let r = 0; r < baseMap.length; r++) {
    let row = [];
    for (let c = 0; c < baseMap[r].length; c++) {
      const ch = baseMap[r][c];
      row.push(ch);
      const x = c * tileSize;
      const y = r * tileSize;

      if (ch === ".") {
        pellets.push({x, y, eaten: false});
      } else if (ch === "B") {
        bats.push({x, y, taken: false});
      } else if (ch === "P") {
        player = {x, y, dir: {x:0,y:0}, power:0};
      }
    }
    grid.push(row);
  }

  // Spawn ghosts
  for (let i = 0; i < Math.min(3+level,6); i++) {
    ghosts.push({x: tileSize*14, y: tileSize*15, dir:{x:0,y:0}});
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Pellets
  ctx.fillStyle="white";
  pellets.forEach(p=>{
    if(!p.eaten) ctx.fillRect(p.x+8,p.y+8,4,4);
  });

  // Bats
  ctx.fillStyle="purple";
  bats.forEach(b=>{
    if(!b.taken) ctx.beginPath(),ctx.arc(b.x+10,b.y+10,6,0,Math.PI*2),ctx.fill();
  });

  // Player
  ctx.fillStyle = player.power>0?"cyan":"green";
  ctx.beginPath();
  ctx.arc(player.x+10,player.y+10,9,0,Math.PI*2);
  ctx.fill();

  // Ghosts
  ctx.fillStyle="red";
  ghosts.forEach(g=>{
    ctx.beginPath();
    ctx.arc(g.x+10,g.y+10,9,0,Math.PI*2);
    ctx.fill();
  });

  // HUD
  ctx.fillStyle="white";
  ctx.fillText(`Score: ${score}  Lives: ${lives}  Level: ${level}`,20,canvas.height-10);
}

function update() {
  // Move player
  player.x += player.dir.x*2;
  player.y += player.dir.y*2;

  // Boundaries
  if(player.x<0) player.x=canvas.width-tileSize;
  if(player.x>=canvas.width) player.x=0;

  // Pellet collision
  pellets.forEach(p=>{
    if(!p.eaten && Math.abs(player.x-p.x)<10 && Math.abs(player.y-p.y)<10){
      p.eaten=true;
      score+=10;
    }
  });

  // Bat collision
  bats.forEach(b=>{
    if(!b.taken && Math.abs(player.x-b.x)<10 && Math.abs(player.y-b.y)<10){
      b.taken=true;
      player.power=500; // ~8 seconds
      score+=50;
    }
  });

  // Ghost AI
  ghosts.forEach(g=>{
    if(Math.random()<0.05){
      const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      g.dir=dirs[Math.floor(Math.random()*4)];
    }
    g.x+=g.dir.x*1.2;
    g.y+=g.dir.y*1.2;

    if(player.power>0){
      // Player can eat ghost
      if(Math.abs(player.x-g.x)<10 && Math.abs(player.y-g.y)<10){
        g.x=tileSize*14; g.y=tileSize*15; // respawn
        score+=200;
      }
    } else {
      // Ghost kills player
      if(Math.abs(player.x-g.x)<10 && Math.abs(player.y-g.y)<10){
        lives--;
        if(lives<=0){ alert("Game Over. Score: "+score); level=1; score=0; lives=3; }
        initLevel();
      }
    }
  });

  if(player.power>0) player.power--;

  // Level complete
  if(pellets.every(p=>p.eaten)){
    level++;
    initLevel();
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown",e=>{
  if(e.key==="ArrowUp") player.dir={x:0,y:-1};
  if(e.key==="ArrowDown") player.dir={x:0,y:1};
  if(e.key==="ArrowLeft") player.dir={x:-1,y:0};
  if(e.key==="ArrowRight") player.dir={x:1,y:0};
});

initLevel();
loop();
