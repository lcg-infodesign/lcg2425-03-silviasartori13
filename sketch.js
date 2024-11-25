let table;
let selectedRiver = null; // Memorizziamo il fiume selezionato
let continentColors = {}; // Colori per ciascun continente
let glyphPositions = []; // Array per salvare le posizioni dei glifi
let tooltip = { x: 0, y: 0, text: "", visible: false }; // Tooltip per informazioni sui glifi

const MIN_GLYPH_DISTANCE = 20; // Distanza minima tra i glifi

function preload() {
  // Carichiamo il dataset
  try {
    table = loadTable('data.csv', 'csv', 'header');
  } catch (error) {
    console.error("Errore nel caricamento del dataset:", error);
    noLoop(); // Ferma il disegno se non ci sono dati
  }
}

function setup() {
  // Creiamo il canvas
  createCanvas(windowWidth, windowHeight);

  // Assegna un colore per ogni continente
  let rows = table.getRows();
  for (let row of rows) {
    let continent = row.getString('continent');
    if (!continentColors[continent]) {
      continentColors[continent] = color(random(255), random(255), random(255)); // Colori casuali
    }
  }
}

function draw() {
  background(240); // Puliamo lo schermo
  glyphPositions = []; // Reset delle posizioni

  let rows = table.getRows();
  let cols = floor(width / 150); // Calcolo dinamico delle colonne
  let marginLeft = 100;
  let marginTop = 150;
  let marginRight = 20;
  let marginBottom = 100;
  let rowMargin = 30;
  let maxSize = 100;

  let spacingX = (width - marginLeft - marginRight) / cols;
  let spacingY = (height - marginTop - marginBottom - rowMargin * Math.ceil(rows.length / cols)) / Math.ceil(rows.length / cols);

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i];
    let col = i % cols;
    let rowIndex = floor(i / cols);

    let x = marginLeft + col * spacingX;
    let y = marginTop + rowIndex * (spacingY + rowMargin);
    let length = row.getNum('length');
    if (isNaN(length) || length === 0) continue;

    let size = map(length, 1000, 7000, 30, maxSize);

    if (selectedRiver === row.getString('name')) {
      size += sin(frameCount * 0.1) * 5; // Effetto pulsante
    }

    // Controlla la sovrapposizione con altri glifi
    let overlap = true;
    let attempts = 0;
    while (overlap && attempts < 50) {
      overlap = false;
      for (let pos of glyphPositions) {
        let d = dist(x, y, pos.x, pos.y);
        if (d < size / 2 + pos.size / 2 + MIN_GLYPH_DISTANCE) {
          // Se si sovrappongono, prova una nuova posizione
          x = random(marginLeft, width - marginRight);
          y = random(marginTop, height - marginBottom);
          overlap = true;
          attempts++;
          break;
        }
      }
    }

    glyphPositions.push({ x, y, size, name: row.getString('name'), row });

    // Disegniamo il glifo
    fill(continentColors[row.getString('continent')]);
    noStroke();
    ellipse(x, y, size);

    // Disegniamo i cerchi dei paesi
    let countries = row.getNum('countries');
    if (!isNaN(countries) && countries > 0) {
      drawCountryCircles(x, y, size, countries);
    }

    // Contorno per il glifo selezionato
    if (selectedRiver === row.getString('name')) {
      stroke(0);
      strokeWeight(4);
      noFill();
      ellipse(x, y, size + 10);
    }
  }

  drawLegend(); // Disegna la leggenda

  if (selectedRiver) {
    displaySelectedRiver(); // Mostra il nome del fiume selezionato
  }

  if (tooltip.visible) {
    displayTooltip(); // Mostra il tooltip se necessario
  }
}

function mousePressed() {
  for (let pos of glyphPositions) {
    let d = dist(mouseX, mouseY, pos.x, pos.y);
    if (d < pos.size / 2) {
      selectedRiver = selectedRiver === pos.name ? null : pos.name;
      redraw();
      return;
    }
  }
}

function mouseMoved() {
  tooltip.visible = false; // Nascondi il tooltip di default
  for (let pos of glyphPositions) {
    let d = dist(mouseX, mouseY, pos.x, pos.y);
    if (d < pos.size / 2) {
      tooltip = {
        x: mouseX + 10,
        y: mouseY + 10,
        text: `Name: ${pos.name}\nLength: ${pos.row.getNum('length')} km\nCountries: ${pos.row.getNum('countries')}`,
        visible: true,
      };
      break;
    }
  }
  redraw(); // Ridisegna per aggiornare il tooltip
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}

function drawLegend() {
  let legendX = width - 200;
  let legendY = 100;
  let boxSize = 20;
  let margin = 10;
  let rowHeight = boxSize + margin;

  fill(0);
  textSize(24);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text("Legenda", legendX, legendY);

  textStyle(NORMAL);
  text("Continenti", legendX, legendY + rowHeight);

  let rowIndex = 0;
  for (let continent in continentColors) {
    fill(continentColors[continent]);
    noStroke();
    rect(legendX, legendY + (rowIndex + 2) * rowHeight, boxSize, boxSize);

    fill(0);
    text(continent, legendX + boxSize + margin, legendY + (rowIndex + 2) * rowHeight);
    rowIndex++;
  }

  let circleY = legendY + (rowIndex + 2) * rowHeight;
  fill(255, 0, 0);
  noStroke();
  ellipse(legendX, circleY, boxSize, boxSize);

  fill(0);
  text("Countries", legendX + boxSize + margin, circleY - boxSize / 2);
}

function drawCountryCircles(x, y, size, countries) {
  let baseRadius = size / 2 + 10;
  let circleSize = 12;
  let maxSides = 12;

  let sides = min(countries, maxSides);
  let angleStep = TWO_PI / sides;

  let currentRadius = baseRadius;
  for (let i = 0; i < countries; i++) {
    let angle = i * angleStep;
    let circleX = x + cos(angle) * currentRadius;
    let circleY = y + sin(angle) * currentRadius;

    fill(255, 0, 0);
    noStroke();
    ellipse(circleX, circleY, circleSize);

    if (i + 1 === sides && countries > maxSides) {
      sides = min(countries - (i + 1), maxSides);
      currentRadius += circleSize + 5;
      angleStep = TWO_PI / sides;
    }
  }
}

function displaySelectedRiver() {
  let legendX = 20;
  let legendY = 20;
  fill(0);
  textSize(32);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text(`River's name: ${selectedRiver}`, legendX, legendY);
}

function displayTooltip() {
  let padding = 10;
  let lines = tooltip.text.split('\n');
  let textWidth = 0;

  for (let line of lines) {
    textWidth = max(textWidth, textWidth(line));
  }

  let boxWidth = textWidth + padding * 2;
  let boxHeight = lines.length * 16 + padding * 2;

  fill(255, 240);
  stroke(0);
  strokeWeight(1);
  rect(tooltip.x, tooltip.y, boxWidth, boxHeight, 5);

  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], tooltip.x + padding, tooltip.y + padding + i * 16);
  }
}
