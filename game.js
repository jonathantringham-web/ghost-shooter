const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const overlay = document.getElementById("overlay");
const bgMusic = document.getElementById("bg-music");

const tileSize = 20;
let rows, cols;
let level = 1, score = 0, lives = 3;
let player, ghosts, pellets, bats, map;
let gameRunning = false;

const SPEED = 2;

// Simplified map for demo
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
rows = baseMap.length;
cols = baseMap[0].length;

function initLevel() {
  pellets=[]; bats=[]; ghosts=[]; player=null; map=[];
  for (let r=0;r<rows;r++){
    map[r]=[];
    for(let c=0;c<cols;c++){
      const ch=baseMap[r][c];
      map[r][c]=ch;
      const x=c*tileSize, y=r*tileSize;
      if(ch===".") pellets.push({x,y,eaten:false});
      if(ch==="P") player={x,y,dir:{x:0,y:0},nextDir:{x:0,y:0},power:0};
    }
  }
  bats.push({x:20,y:20,taken:false});
  bats.push({x:520,y:20,taken:false});
  ghosts.push({x:280,y:140,dir:{x:1,y:0}});
}

function drawMap() {
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(map[r][c]==="W"){
        let colors=["#0ff","#0cf","#80f","#44f"];
        ctx.fillStyle=colors[Math.floor(Math.random()*colors.length)];
        ctx.fillRect(c*tileSize,r*tileSize,tileSize,tileSize);
      }
    }
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawMap();
  ctx.fillStyle="white";
  pellets.forEach(p=>{if(!p.eaten) ctx.fillRect(p.x+8,p.y+8,4,4);});
  ctx.fillStyle="purple";
  bats.forEach(b=>{if(!b.taken){ctx.beginPath();ctx.arc(b.x+10,b.y+10,6,0,2*Math.PI);ctx.fill();}});
  ctx.fillStyle= player.power>0? "cyan":"lime";
  ctx.beginPath();ctx.arc(player.x+10,player.y+10,9,0,2*Math.PI);ctx.fill();
  ctx.fillStyle="red";
  ghosts.forEach(g=>{ctx.beginPath();ctx.arc(g.x+10,g.y+10,9,0,2*Math.PI);ctx.fill();});
}

function update() {
  tryChangeDir(player);
  move(player);
  pellets.forEach(p=>{
    if(!p.eaten && Math.abs(player.x-p.x)<10 && Math.abs(player.y-p.y)<10){
      p.eaten=true; score+=10;
    }
  });
  bats.forEach(b=>{
    if(!b.taken && Math.abs(player.x-b.x)<12 && Math.abs(player.y-b.y)<12){
      b.taken=true; player.power=400; score+=50;
    }
  });
  ghosts.forEach(g=>{
    if(Math.random()<0.05){
      const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
      g.dir=dirs[Math.floor(Math.random()*4)];
    }
    move(g,1.5);
    if(Math.abs(player.x-g.x)<10 && Math.abs(player.y-g.y)<10){
      if(player.power>0){g.x=280;g.y=140;score+=200;}
      else{lives--;if(lives<=0){alert("Game Over. Score:"+score);resetGame();}initLevel();}
    }
  });
  if(player.power>0) player.power--;
  if(pellets.every(p=>p.eaten)){level++;initLevel();}
  hud.textContent=`Score: ${score}   Lives: ${lives}   Level: ${level}`;
}

function move(e,speedFactor=1){
  const sp=SPEED*speedFactor;
  let nx=e.x+e.dir.x*sp, ny=e.y+e.dir.y*sp;
  if(!hitsWall(nx,ny)){e.x=nx;e.y=ny;}
}
function hitsWall(x,y){
  const r=Math.floor(y/tileSize), c=Math.floor(x/tileSize);
  if(r<0||c<0||r>=rows||c>=cols) return true;
  return map[r][c]==="W";
}
function tryChangeDir(e){
  if(!hitsWall(e.x+e.nextDir.x*tileSize, e.y+e.nextDir.y*tileSize)){
    e.dir=e.nextDir;
  }
}

// input
window.addEventListener("keydown",e=>{
  if(e.key==="ArrowUp") player.nextDir={x:0,y:-1};
  if(e.key==="ArrowDown") player.nextDir={x:0,y:1};
  if(e.key==="ArrowLeft") player.nextDir={x:-1,y:0};
  if(e.key==="ArrowRight") player.nextDir={x:1,y:0};
});

// mobile buttons
document.getElementById("btn-up").onclick=()=>player.nextDir={x:0,y:-1};
document.getElementById("btn-down").onclick=()=>player.nextDir={x:0,y:1};
document.getElementById("btn-left").onclick=()=>player.nextDir={x:-1,y:0};
document.getElementById("btn-right").onclick=()=>player.nextDir={x:1,y:0};

function gameLoop(){if(gameRunning){update();draw();}requestAnimationFrame(gameLoop);}
function resetGame(){level=1;score=0;lives=3;initLevel();}
function startGame(){overlay.style.display="none";gameRunning=true;bgMusic.play();resetGame();}

overlay.addEventListener("click",startGame);
gameLoop();
