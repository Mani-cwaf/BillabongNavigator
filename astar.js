const SPEED = 1

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

    const results = [];

    for (let y = 0; y < img.height; y++) {
        results[y] = [];
        for (let x = 0; x < img.width; x++) {
            const imageData = ctx.getImageData(x, y, 1, 1);
            const data = imageData.data;
            let isObstacle = false;

            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b, a] = data.slice(i, i + 4);
                if (a > 128 && (r < 200 || g < 200 || b < 200)) {
                    isObstacle = true;
                    break;
                }
            }
            results[y][x] = !isObstacle;
        }
    }
    return results;
}

function Astar(grid, start, goal) {
    const heuristic = (a, b) => {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2) * SPEED;
    };

    class Node {
        constructor(parent, pos) {
            this.parent = parent;
            this.pos = pos;
            this.initialCost = 0;
            this.heuristic = 0;
            this.totalCost = 0;
        }
    }

    const startNode = new Node(null, { x: start[0], y: start[1] });
    const goalNode = new Node(null, { x: goal[0], y: goal[1] });

    const openSet = [];
    const closedSet = new Set();

    openSet.push(startNode);

    while (openSet.length > 0) {
        let lowestIndex = 0;
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].totalCost < openSet[lowestIndex].totalCost) {
                lowestIndex = i;
            }
        }
        let currentNode = openSet[lowestIndex];

        openSet.splice(lowestIndex, 1);
        closedSet.add(`${currentNode.pos.x}-${currentNode.pos.y}`);

        if (currentNode.pos.x === goalNode.pos.x && currentNode.pos.y === goalNode.pos.y) {
            let path = [];
            let temp = currentNode;
            while (temp !== null) {
                path.push([temp.pos.x, temp.pos.y]);
                temp = temp.parent;
            }
            return path.reverse();
        }

        let neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;

                const checkX = currentNode.pos.x + i;
                const checkY = currentNode.pos.y + j;

                if (
                    checkY >= 0 && checkY < grid.length &&
                    checkX >= 0 && checkX < grid[0].length &&
                    grid[checkY][checkX]
                ) {
                    neighbors.push(new Node(currentNode, { x: checkX, y: checkY }));
                }
            }
        }

        for (let neighbor of neighbors) {
            const neighborId = `${neighbor.pos.x}-${neighbor.pos.y}`;
            if (closedSet.has(neighborId)) {
                continue;
            }

            const score = currentNode.initialCost + ((neighbor.pos.x !== currentNode.pos.x && neighbor.pos.y !== currentNode.pos.y) ? 1.414 : 1);
            let bestScore = false;

            const existingNode = openSet.find(node => node.pos.x === neighbor.pos.x && node.pos.y === neighbor.pos.y);

            if (!existingNode) {
                bestScore = true;
                neighbor.heuristic = heuristic(neighbor.pos, goalNode.pos);
                openSet.push(neighbor);
            } else if (score < existingNode.initialCost) {
                bestScore = true;
            }

            if (bestScore) {
                const nodeToUpdate = existingNode || neighbor;
                nodeToUpdate.parent = currentNode;
                nodeToUpdate.initialCost = score;
                nodeToUpdate.totalCost = nodeToUpdate.initialCost + nodeToUpdate.heuristic;
            }
        }
    }

    return "no path found";
}

const image = document.querySelector('img');
const pathContainer = document.querySelector(".pathing");

export const createPath = (floor, start, end) => {
    pathContainer.innerHTML = "";

    const imageBounds = image.getBoundingClientRect();

    const ratio = imageBounds.width / image.naturalWidth;

    createGrid(`./obstacles/floor${floor}.jpg`).then(grid => {
        const startGrid = [Math.floor(start[0]), Math.floor(start[1])];
        const endGrid = [Math.floor(end[0]), Math.floor(end[1])];

        if (!grid[startGrid[1]] || !grid[startGrid[1]][startGrid[0]]) {
            console.error("Start point is on an obstacle!");
            return;
        }
        if (!grid[endGrid[1]] || !grid[endGrid[1]][endGrid[0]]) {
            console.error("End point is on an obstacle!");
            return;
        }

        const bestPath = Astar(grid, startGrid, endGrid);

        if (typeof bestPath === "string") {
            console.log(bestPath);
            return;
        }

        bestPath.forEach(async (cell, i) => {
            await new Promise(r => setTimeout(r, (i+1) * (10 / SPEED)));
            const cellElement = document.createElement("div");
            cellElement.classList.add("path-cell");
            cellElement.style.left = `${cell[0] * ratio}px`;
            cellElement.style.top = `${cell[1] * ratio}px`;
            pathContainer.appendChild(cellElement);
        });
    });
};