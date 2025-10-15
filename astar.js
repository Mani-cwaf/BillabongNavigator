const gridCache = {};

const pathContainer = document.querySelector(".pathing");
const distance = document.querySelector(".distance");

async function createGrid(src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    await img.decode();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const grid = [];
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;

    for (let y = 0; y < img.height; y++) {
        grid[y] = [];
        for (let x = 0; x < img.width; x++) {
            const index = (y * img.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            const isObstacle = a > 128 && (r < 250 || g < 250 || b < 250);
            grid[y][x] = !isObstacle; 
        }
    }
    return grid;
}

async function Astar(grid, start, goal, speed) {
    const heuristic = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) * speed;

    class Point {
        constructor(parent, pos) {
            this.parent = parent;
            this.pos = pos;
            this.initialCost = 0;
            this.tileCost = 0;
            this.heuristic = 0; 
            this.finalCost = 0; 
        }
    }

    const startPoint = new Point(null, { x: start[0], y: start[1] });
    const goalPoint = new Point(null, { x: goal[0], y: goal[1] });

    const openSet = [startPoint];
    const closedSet = new Set();
    let iterations = 0;

    while (openSet.length > 0) {

        if (iterations++ % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].finalCost < openSet[lowestIndex].finalCost) {
                lowestIndex = i;
            }
        }
        let currentNode = openSet[lowestIndex];

        if (currentNode.pos.x === goalPoint.pos.x && currentNode.pos.y === goalPoint.pos.y) {
            let path = [];
            let temp = currentNode;
            while (temp !== null) {
                path.push([temp.pos.x, temp.pos.y, temp.tileCost]);
                temp = temp.parent;
            }
            return path.reverse();
        }

        openSet.splice(lowestIndex, 1);
        closedSet.add(`${currentNode.pos.x}-${currentNode.pos.y}`);

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const checkX = currentNode.pos.x + i;
                const checkY = currentNode.pos.y + j;
                const neighborId = `${checkX}-${checkY}`;

                if (checkY < 0 || checkY >= grid.length || checkX < 0 || checkX >= grid[0].length || !grid[checkY][checkX] || closedSet.has(neighborId)) {
                    continue;
                }

                currentNode.tileCost = (i !== 0 && j !== 0) ? 1.414 : 1;
                const cost = currentNode.initialCost + currentNode.tileCost;
                const existingNode = openSet.find(Point => Point.pos.x === checkX && Point.pos.y === checkY);

                if (!existingNode || cost < existingNode.initialCost) {
                    const neighbor = existingNode || new Point(currentNode, { x: checkX, y: checkY });
                    neighbor.parent = currentNode;
                    neighbor.initialCost = cost;
                    neighbor.heuristic = heuristic(neighbor.pos, goalPoint.pos);
                    neighbor.finalCost = neighbor.initialCost + neighbor.heuristic;
                    if (!existingNode) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
    }
    return "no path found";
}

function drawPath(bestPath, speed) {
    const mapContainer = document.querySelector('.map');
    const imageElement = mapContainer.querySelector('img');

    pathContainer.innerHTML = ""; 

    if (typeof bestPath === "string") {
        console.error(bestPath);
        return;
    }

    const ratio = imageElement.clientWidth / imageElement.naturalWidth;
    let delay = 0
    let currentdistance = 0;

    bestPath.forEach(async (cell) => {
        delay += (5 * cell[2] * (1000 / imageElement.naturalWidth) / speed)
        await new Promise(r => setTimeout(r, delay))
        currentdistance += cell[2];
        const cellElement = document.createElement("div");
        cellElement.classList.add("path-cell");
        cellElement.style.width = `${ratio}px`;
        cellElement.style.height = `${ratio}px`;
        cellElement.style.left = `${(cell[0] * ratio)}px`;
        cellElement.style.top = `${(cell[1] * ratio)}px`;
        distance.innerText = `Distance: ${(currentdistance * ratio / 5).toFixed(2)} meters`;
        pathContainer.appendChild(cellElement);
    });
}

export const createPath = async (floor, start, end, speed = 1) => {
    pathContainer.innerHTML = ""; 

    if (!gridCache[floor]) {
        gridCache[floor] = await createGrid(`./obstacles/floor${floor}.jpg`);
    }

    const grid = gridCache[floor];
    const startGrid = [Math.floor(start[0]), Math.floor(start[1])];
    const endGrid = [Math.floor(end[0]), Math.floor(end[1])];

    if (!grid[startGrid[1]] || !grid[startGrid[1]][startGrid[0]]) {
        console.error("Start point is invalid");
        return;
    }
    if (!grid[endGrid[1]] || !grid[endGrid[1]][endGrid[0]]) {
        console.error("End point is invalid");
        return;
    }

    const bestPath = await Astar(grid, startGrid, endGrid, speed);

    drawPath(bestPath, speed);
};