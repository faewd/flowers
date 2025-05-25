

let _ctx;
let timeouts = [];

onmessage = e => {
  if (e.data.event === "start") {
    const canvas = e.data.canvas
    _ctx = canvas.getContext("2d")
  }

  if (e.data.event === "restart") {
    timeouts.forEach(clearTimeout)
  }

  drawFlowers(e.data.config, _ctx)
}

function drawFlowers(cfg, ctx) {
  const OX = cfg.width / 2;
  const OY = cfg.height;

  function getStemSize(age) {
    return (cfg.stemMaxAge - age) / 50
  }

  function drawBud({ type, x, y, age, dir }) {
      const size = getStemSize(age);

      if (type === "stem") {
        drawBlob(x, y, size, cfg.stemColors[Math.min(Math.floor(age / cfg.stemMaxAge * 6), cfg.stemColors.length - 1)]);
      } else if (type === "flower") {
        const col = age < 20 ? cfg.stemColors[Math.floor(age / 5)] : cfg.pistilColor
        drawBlob(x, y, 2, col)
      } else if (type === "petal") {
        const bx = x + Math.cos(Math.PI * 2 * dir) * age
        const by = y + Math.sin(Math.PI * 2 * dir) * age
        const col = cfg.petalColors[Math.floor(dir * cfg.petalCount) % cfg.petalColors.length]
        drawBlob(bx, by, cfg.petalThickness / 5, col)
      }
  }

  function drawBlob(bx, by, radius, col) {
    ctx.fillStyle = col
    ctx.beginPath();
    ctx.ellipse(OX + bx, OY - by, radius, radius, 0, 0, 2 * Math.PI)
    for (let y = 0; y < cfg.height; y++) {
        for (let x = 0; x < cfg.width; x++) {
        if (ctx.isPointInPath(x + 0.5, y + 0.5)) {
            ctx.moveTo(x, y);
            ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  function spawnBuds({ type, x, y, age, dir }) {
    const newBuds = []

    if (type === "stem") {
      const size = getStemSize(age)

      if (age > cfg.flowerMinHeight && Math.random() < cfg.flowerChance) {
        newBuds.push({
          type: "flower",
          x: x + Math.random() * cfg.flowerMaxOffset - 1,
          y: y + Math.random() * cfg.flowerMaxOffset - 1,
          age: 0,
          dir: dir
        })
      }

      if (age < cfg.stemMaxAge && size >= 1) newBuds.push({
        type: "stem",
        x: x + dir,
        y: y + size,
        age: age + 1,
        dir: Math.min(Math.max(-cfg.stemMaxBranchAngle, dir + (Math.random() - 0.5) * cfg.stemCurviness), cfg.stemMaxBranchAngle)
      });

      if (Math.random() < cfg.branchChance) {
        newBuds.push({
          type: "stem",
          x: x + dir,
          y: y + size,
          age: age + Math.random(),
          dir: Math.sign(Math.random() - 0.5) * Math.max(cfg.stemMinBranchAngle, Math.random() * cfg.stemMaxBranchAngle)
        });
      }
    } else if (type === "flower") {
      newBuds.push({
        type: "flower",
        x, y, dir,
        age: age + 1
      })
      
      if (age == 20) {
        for (let i = 0; i < cfg.petalCount; i++) {
          newBuds.push({
            type: "petal",
            x,
            y,
            dir: i / cfg.petalCount,
            age: 0,
          })
        }
      }
    } else if (type === "petal") {
      if (age < cfg.petalMaxLength) {
        newBuds.push({
          type: "petal",
          x,
          y,
          dir,
          age: age + 1,
        })
      }
    }

    return newBuds;
  }

  function tick(buds) {
    const newBuds = buds.flatMap(bud => {
      drawBud(bud)
      return spawnBuds(bud)
    })

    if (newBuds.length > 0) timeouts.push(setTimeout(() => tick(newBuds), 50))
  }

  ctx.fillStyle = cfg.bgColor;
  ctx.fillRect(0, 0, cfg.width, cfg.height)

  tick([{ type: "stem", x: 0, y: 0, age: 0, dir: 0 }]);
}
