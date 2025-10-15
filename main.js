const map = document.querySelector('.map');
const image = document.querySelector('img');
const pointsContainer = document.querySelector('.points');
const pathing = document.querySelector('.pathing');
const floorup = document.querySelector('.floor-up');
const floordown = document.querySelector('.floor-down');
const currentfloor = document.querySelector('.floor-indicator');
const overlay = document.querySelector(".overlay");
const body = document.body;

const mapBounds = map.getBoundingClientRect();

let floor = 0;

let currentmovement = {
    x: 0,
    y: 0
};

let lastpos = {
    x: 0,
    y: 0
};

let selectedPoints = {
    start: null,
    end: null
}

let speed = 1;

const selectPoint = (x, y) => {
    if (selectedPoints.start == null) {
        selectedPoints.start = [x, y];
    } else if (JSON.stringify(selectedPoints.start) == JSON.stringify([x, y])) {
        selectedPoints.start = null;
    } else if (selectedPoints.end == null && (JSON.stringify(selectedPoints.start) != JSON.stringify([x, y]))) {
        selectedPoints.end = [x, y];
        import("./astar.js").then((module) => {
            const points = [...pointsContainer.children];
            points.forEach(point => point.classList.remove("active"));
            module.createPath(floor, selectedPoints.start, selectedPoints.end, speed);
            selectedPoints.start = null;
            selectedPoints.end = null;
        })
    } else {
        selectedPoints.end = null;
    }
}

let held = false;
body.addEventListener("mousedown", (e) => {
    held = true;
    lastpos.x = e.clientX;
    lastpos.y = e.clientY;
    body.style.cursor = "grabbing";
});
body.onmouseup = () => {
    held = false;
    body.style.cursor = "grab";
};

sens = 1;
body.addEventListener("mousemove", (e) => {
    if (held) {
        currentmovement.x = Math.max(-(mapBounds.width * (zoom - 1) / 2), Math.min((mapBounds.width * (zoom - 1) / 2), currentmovement.x + (lastpos.x - e.clientX) * sens));
        currentmovement.y = Math.max(-(mapBounds.height * (zoom - 1) / 2), Math.min((mapBounds.height * (zoom - 1) / 2), currentmovement.y + (lastpos.y - e.clientY) * sens));

        if (zoom > 1) {
            map.style.transform = `translate(${-currentmovement.x}px, ${-currentmovement.y}px) scale(${zoom})`;
        }
    }

    lastpos.x = e.clientX;
    lastpos.y = e.clientY;
})

zoom = 1;

document.onkeydown = (e) => {
    held = false;

    if (e.key == "ArrowUp") {
        speed = Math.min(10, Math.max(0.5, speed * 1.25));
    }
    else if (e.key == "ArrowDown") {
        speed = Math.min(10, Math.max(0.5, speed * (1/1.25)));
    }
};
document.onwheel = (e) => {
    if (e.deltaY < 0) {
        zoom = zoom * (1.2);

    } else if (e.deltaY > 0) {
        zoom = zoom * (1 / 1.2);
    }
    updateZoom();
};

const updateZoom = () => {
    if (zoom <= 1) {
        currentmovement.x = 0;
        currentmovement.y = 0;
    }
    map.style.transform = `translate(${-currentmovement.x}px, ${-currentmovement.y}px) scale(${zoom})`;
    const points = [...pointsContainer.children];
    points.forEach(child => child.style.transform = `scale(${(1 / zoom)})`);
}

let ratio;
const createpoint = (x, y, name, description) => {
    const point = document.createElement('div');
    point.classList.add("point");
    point.style.top = `${y * ratio - 10}px`;
    point.style.left = `${x * ratio - 10}px`;
    point.style.transform = `scale(${(1 / zoom)})`;

    const info = document.createElement('div');
    info.classList.add("info");
    info.innerHTML = `<h1>${name}</h1> <p>${description}<p>`;

    point.appendChild(info);
    point.onclick = () => {
        point.classList.contains("active") ? point.classList.remove("active") : point.classList.add("active")
        selectPoint(x, y)
    }
    pointsContainer.appendChild(point);
};

let navpoints;
fetch('navpoints.json').then(response => response.json()).then(data => { navpoints = data }).then(() => { changefloor() });

const changefloor = () => {
    pointsContainer.innerHTML = "";
    pathing.innerHTML = "";
    currentfloor.innerText = navpoints[floor].floor;
    image.src = `floors/floor${floor}.jpg`
    zoom = 1;
    updateZoom();
    setTimeout(() => {
        const imageBounds = image.getBoundingClientRect();
        ratio = imageBounds.width / image.naturalWidth
        overlay.style.width = imageBounds.width + "px";
        overlay.style.height = imageBounds.height + "px";
        navpoints[floor]["points"].forEach(navpoint => {
            createpoint(navpoint.x, navpoint.y, navpoint.name, navpoint.description);
        });
    }, 100);
};
floorup.onmousedown = () => {
    if (floor < (navpoints.length - 1)) {
        floor += 1;
        changefloor();
    }
};
floordown.onmousedown = () => {
    if (floor > 0) {
        floor -= 1;
        changefloor();
    }
};