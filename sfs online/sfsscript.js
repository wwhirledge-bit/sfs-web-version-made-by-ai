window.onload = function() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const G = 0.1; // Gravity constant
  let keys = {};

  document.addEventListener('keydown', e => keys[e.code] = true);
  document.addEventListener('keyup', e => keys[e.code] = false);

  class Planet {
    constructor(name, x, y, mass, radius, color='#0f0') {
      this.name = name;
      this.x = x;
      this.y = y;
      this.mass = mass;
      this.radius = radius;
      this.color = color;
      this.landingPads = [];
    }
    addLandingPad(xOffset, width=40) {
      this.landingPads.push({ x:this.x + xOffset, y:this.y - this.radius, width });
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      for (const pad of this.landingPads) {
        ctx.fillRect(pad.x-pad.width/2, pad.y-5, pad.width, 5);
      }
    }
  }

  class Rocket {
    constructor(x, y, stages=[{fuel:100, thrust:0.2}]) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = -1;
      this.angle = -Math.PI/2;
      this.stages = stages;
      this.currentStage = 0;
      this.width = 15;
      this.height = 40;
      this.score = 0;
    }
    get fuel() { return this.stages[this.currentStage].fuel; }
    get thrust() { return this.stages[this.currentStage].thrust; }

    update(planets) {
      if (this.fuel > 0 && keys['ArrowUp']) {
        let mass = 1 + 0.01 * this.stages[this.currentStage].fuel;
        this.vx += Math.cos(this.angle)*(this.thrust/mass);
        this.vy += Math.sin(this.angle)*(this.thrust/mass);
        this.stages[this.currentStage].fuel -= 0.2;
      }
      if (keys['ArrowLeft']) this.angle -= 0.03;
      if (keys['ArrowRight']) this.angle += 0.03;

      if (this.fuel <= 0 && this.currentStage < this.stages.length-1) this.currentStage++;

      for (const p of planets) {
        const dx = p.x - this.x;
        const dy = p.y - this.y;
        const distSq = dx*dx + dy*dy;
        const dist = Math.sqrt(distSq);
        const force = G * p.mass / distSq;
        this.vx += dx/dist*force;
        this.vy += dy/dist*force;
      }

      this.x += this.vx;
      this.y += this.vy;

      let closest = planets.reduce((a,b)=> (Math.hypot(a.x-this.x,a.y-this.y)<Math.hypot(b.x-this.x,b.y-this.y)?a:b));
      let altitude = Math.hypot(closest.x-this.x, closest.y-this.y) - closest.radius;
      let speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);

      document.getElementById('fuel').innerText = 'Fuel: '+this.fuel.toFixed(1);
      document.getElementById('velocity').innerText = 'Velocity: '+speed.toFixed(2);
      document.getElementById('altitude').innerText = 'Altitude: '+altitude.toFixed(2);
      document.getElementById('score').innerText = 'Score: '+this.score;
      document.getElementById('stage').innerText = 'Stage: '+(this.currentStage+1);
      document.getElementById('currentPlanet').innerText = 'Planet: '+closest.name;

      for (const pad of closest.landingPads) {
        if (Math.abs(this.x-pad.x)<pad.width/2 && Math.abs(this.y-(closest.y-closest.radius))<5 &&
            speed<2 && Math.abs(this.angle+Math.PI/2)<0.2) {
          this.score += 100;
          this.vx = this.vy = 0;
        }
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(0,-this.height/2);
      ctx.lineTo(-this.width/2,this.height/2);
      ctx.lineTo(this.width/2,this.height/2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  const planets = [
    new Planet('Earth', canvas.width/2, canvas.height-100, 10000, 50),
    new Planet('Moon', canvas.width/2+400, canvas.height-300, 5000, 30, '#aaa')
  ];
  planets[0].addLandingPad(-20);
  planets[0].addLandingPad(40);
  planets[1].addLandingPad(0);

  const rocket = new Rocket(canvas.width/2, canvas.height-200, [
    {fuel:100, thrust:0.2},
    {fuel:50, thrust:0.3},
    {fuel:30, thrust:0.5}
  ]);

  function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (const p of planets) p.draw();
    rocket.update(planets);
    rocket.draw();
    requestAnimationFrame(loop);
  }

  loop();
};